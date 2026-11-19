-- RLS for profiles and the tables under it (PRD §12.3), and the SQL functions that save
-- onboarding and /profil steps touching more than one table (AGENTS.md domain rule 7).
--
-- Tables: profiles, profile_contacts, profile_skills, competition_history, portfolio_items.
-- Errors raised for the app use errcode P0001 and the ActionResult code as the message.

-- Links are https only (PRD §14). Zod checks this too; the database is the last line. -----------

alter table profile_skills
  add constraint profile_skills_evidence_https check (evidence_url is null or evidence_url ~ '^https://');
alter table competition_history
  add constraint competition_history_evidence_https check (evidence_url is null or evidence_url ~ '^https://');
alter table portfolio_items
  add constraint portfolio_items_url_https check (url ~ '^https://');

-- profiles.updated_at is the last tie-breaker in the ranking (PRD §7.3) ---------------------------

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch_updated_at
  before update on profiles
  for each row execute function touch_updated_at();

-- Columns the owner can't change through the API ---------------------------------------------
-- Requests from the browser or a server action run as `anon` or `authenticated`. security definer
-- functions (complete_onboarding, admin tools) and the service role run as another role, so they pass.

create or replace function protect_profile_columns() returns trigger
language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') and (
       new.id              is distinct from old.id
    or new.user_id         is distinct from old.user_id
    or new.app_role        is distinct from old.app_role
    or new.is_simulated    is distinct from old.is_simulated
    or new.onboarding_done is distinct from old.onboarding_done
    or new.created_at      is distinct from old.created_at
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0001',
      detail = 'id, user_id, app_role, is_simulated, onboarding_done and created_at are read-only';
  end if;
  return new;
end $$;

create trigger profiles_protect_columns
  before update on profiles
  for each row execute function protect_profile_columns();

-- profiles -----------------------------------------------------------------------------------
-- Everyone reads (public profiles, ranking). Rows are created by handle_new_user, so there is no
-- insert policy; deleting an account (F-PRF-08) will be its own function.

alter table profiles enable row level security;

create policy "profiles readable by everyone" on profiles
  for select using (true);

create policy "profiles updatable by owner" on profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- profile_contacts (ADR 0003) ----------------------------------------------------------------

alter table profile_contacts enable row level security;

create policy "contacts readable by owner or teammates" on profile_contacts
  for select to authenticated
  using (
    profile_id = (select current_profile_id())
    or are_teammates((select current_profile_id()), profile_id)
  );

create policy "contacts insertable by owner" on profile_contacts
  for insert to authenticated
  with check (profile_id = (select current_profile_id()));

create policy "contacts updatable by owner" on profile_contacts
  for update to authenticated
  using (profile_id = (select current_profile_id()))
  with check (profile_id = (select current_profile_id()));

create policy "contacts deletable by owner" on profile_contacts
  for delete to authenticated
  using (profile_id = (select current_profile_id()));

-- profile_skills, competition_history, portfolio_items: everyone reads, the owner writes ------

alter table profile_skills enable row level security;

create policy "profile skills readable by everyone" on profile_skills
  for select using (true);
create policy "profile skills insertable by owner" on profile_skills
  for insert to authenticated with check (profile_id = (select current_profile_id()));
create policy "profile skills updatable by owner" on profile_skills
  for update to authenticated
  using (profile_id = (select current_profile_id()))
  with check (profile_id = (select current_profile_id()));
create policy "profile skills deletable by owner" on profile_skills
  for delete to authenticated using (profile_id = (select current_profile_id()));

alter table competition_history enable row level security;

create policy "history readable by everyone" on competition_history
  for select using (true);
create policy "history insertable by owner" on competition_history
  for insert to authenticated with check (profile_id = (select current_profile_id()));
create policy "history updatable by owner" on competition_history
  for update to authenticated
  using (profile_id = (select current_profile_id()))
  with check (profile_id = (select current_profile_id()));
create policy "history deletable by owner" on competition_history
  for delete to authenticated using (profile_id = (select current_profile_id()));

alter table portfolio_items enable row level security;

create policy "portfolio readable by everyone" on portfolio_items
  for select using (true);
create policy "portfolio insertable by owner" on portfolio_items
  for insert to authenticated with check (profile_id = (select current_profile_id()));
create policy "portfolio updatable by owner" on portfolio_items
  for update to authenticated
  using (profile_id = (select current_profile_id()))
  with check (profile_id = (select current_profile_id()));
create policy "portfolio deletable by owner" on portfolio_items
  for delete to authenticated using (profile_id = (select current_profile_id()));

-- Step 2: preferred roles and skills, saved together -------------------------------------------
-- p_skills: [{"skill_id": 12, "level": 3, "evidence_url": "https://..." | null}]

create or replace function save_profile_skills(p_preferred_roles text[], p_skills jsonb)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := current_profile_id();
  v_count int;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;
  if coalesce(cardinality(p_preferred_roles), 0) < 1 then
    raise exception 'MIN_ROLES' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_skills) <> 'array' or jsonb_array_length(p_skills) < 3 then
    raise exception 'MIN_SKILLS' using errcode = 'P0001';
  end if;

  update profiles set preferred_roles = p_preferred_roles where id = v_me;

  delete from profile_skills
  where profile_id = v_me
    and skill_id not in (select (s->>'skill_id')::int from jsonb_array_elements(p_skills) s);

  insert into profile_skills (profile_id, skill_id, level, evidence_url)
  select v_me, (s->>'skill_id')::int, (s->>'level')::smallint, nullif(s->>'evidence_url', '')
  from jsonb_array_elements(p_skills) s
  on conflict (profile_id, skill_id)
  do update set level = excluded.level, evidence_url = excluded.evidence_url;

  select count(*) into v_count from profile_skills where profile_id = v_me;
  return v_count;
end $$;

-- Step 3: competition history and portfolio, replaced as a whole --------------------------------
-- Items with an id that belongs to the caller are updated, items without an id are inserted, and
-- the caller's rows missing from the list are deleted. An id owned by someone else is ignored.
-- portfolio_items.cover_path is left alone; covers are uploaded separately (F-PRF-04).

create or replace function save_profile_history_portfolio(p_history jsonb, p_portfolio jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := current_profile_id();
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  delete from competition_history
  where profile_id = v_me
    and id not in (
      select (h->>'id')::uuid from jsonb_array_elements(p_history) h where h->>'id' is not null
    );

  insert into competition_history
    (id, profile_id, competition_name, year, category, role, result, evidence_url, note)
  select coalesce((h->>'id')::uuid, gen_random_uuid()), v_me,
         h->>'competition_name', (h->>'year')::smallint, (h->>'category')::comp_category_t,
         nullif(h->>'role', ''), (h->>'result')::comp_result_t,
         nullif(h->>'evidence_url', ''), nullif(h->>'note', '')
  from jsonb_array_elements(p_history) h
  on conflict (id) do update set
    competition_name = excluded.competition_name,
    year             = excluded.year,
    category         = excluded.category,
    role             = excluded.role,
    result           = excluded.result,
    evidence_url     = excluded.evidence_url,
    note             = excluded.note
  where competition_history.profile_id = v_me;

  delete from portfolio_items
  where profile_id = v_me
    and id not in (
      select (p->>'id')::uuid from jsonb_array_elements(p_portfolio) p where p->>'id' is not null
    );

  insert into portfolio_items (id, profile_id, title, description, url, skill_ids, sort)
  select coalesce((p->>'id')::uuid, gen_random_uuid()), v_me,
         p->>'title', nullif(p->>'description', ''), p->>'url',
         coalesce(array(select jsonb_array_elements_text(p->'skill_ids')::int), '{}'),
         (ord - 1)::smallint
  from jsonb_array_elements(p_portfolio) with ordinality as t(p, ord)
  on conflict (id) do update set
    title       = excluded.title,
    description = excluded.description,
    url         = excluded.url,
    skill_ids   = excluded.skill_ids,
    sort        = excluded.sort
  where portfolio_items.profile_id = v_me;

  update profiles set updated_at = now() where id = v_me;
end $$;

-- Step 4: contact and preferences --------------------------------------------------------------

create or replace function save_profile_contact(
  p_whatsapp       text,
  p_contact_email  text,
  p_hours_per_week smallint,
  p_goal           goal_t,
  p_work_time      work_time_t,
  p_open_to_invite boolean
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := current_profile_id();
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  update profiles set
    hours_per_week = p_hours_per_week,
    goal           = p_goal,
    work_time      = p_work_time,
    open_to_invite = p_open_to_invite
  where id = v_me;

  insert into profile_contacts (profile_id, whatsapp, contact_email)
  values (v_me, p_whatsapp, nullif(p_contact_email, ''))
  on conflict (profile_id) do update set
    whatsapp      = excluded.whatsapp,
    contact_email = excluded.contact_email;
end $$;

-- Finish onboarding: only when every required field is there (PRD F-PRF-01) --------------------

create or replace function complete_onboarding() returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := current_profile_id();
  v_p  profiles;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_p from profiles where id = v_me;

  if v_p.username is null
     or coalesce(v_p.full_name, '') = ''
     or coalesce(v_p.campus, '') = ''
     or coalesce(v_p.major, '') = ''
     or v_p.entry_year is null
     or cardinality(v_p.preferred_roles) < 1
     or (select count(*) from profile_skills where profile_id = v_me) < 3
     or not exists (select 1 from profile_contacts where profile_id = v_me and whatsapp is not null)
  then
    raise exception 'INCOMPLETE' using errcode = 'P0001';
  end if;

  update profiles set onboarding_done = true where id = v_me;
end $$;

-- Only signed-in users call these -----------------------------------------------------------

revoke execute on function save_profile_skills(text[], jsonb) from public, anon;
revoke execute on function save_profile_history_portfolio(jsonb, jsonb) from public, anon;
revoke execute on function save_profile_contact(text, text, smallint, goal_t, work_time_t, boolean) from public, anon;
revoke execute on function complete_onboarding() from public, anon;

grant execute on function save_profile_skills(text[], jsonb) to authenticated;
grant execute on function save_profile_history_portfolio(jsonb, jsonb) to authenticated;
grant execute on function save_profile_contact(text, text, smallint, goal_t, work_time_t, boolean) to authenticated;
grant execute on function complete_onboarding() to authenticated;
