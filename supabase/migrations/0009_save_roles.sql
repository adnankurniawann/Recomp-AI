-- save_roles (PRD F-TEM-02, §13.1): the leader replaces the team's roles in one transaction.
-- p_roles is the same snake_case RoleInput[] as create_team (0008), plus "id" for existing roles.
-- Roles left out are deleted (their invites go with them, on delete cascade). A role that still
-- has members can't be deleted or get fewer slots than its members.
--
-- Lock order matches 0004 (team role first, then the team): accept_invite locks one role and then
-- the team in recompute_team_status, so this locks every role of the team before the team.

create or replace function save_roles(p_team uuid, p_roles jsonb) returns uuid[]
language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := current_profile_id();
  v_team teams;
  v_ids  uuid[];
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  perform 1 from team_roles where team_id = p_team order by id for update;
  select * into v_team from teams where id = p_team for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_team.leader_id <> v_me then
    raise exception 'NOT_LEADER' using errcode = 'P0001';
  end if;
  if v_team.status = 'archived' then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  if jsonb_typeof(p_roles) <> 'array' or jsonb_array_length(p_roles) not between 1 and 6 then
    raise exception 'VALIDATION' using errcode = 'P0001';
  end if;

  if (select sum((r->>'slots')::int) from jsonb_array_elements(p_roles) r)
     > (select team_max from competitions where id = v_team.competition_id) then
    raise exception 'SLOTS_EXCEED_MAX' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_roles) r,
         jsonb_array_elements(r->'required_skills') s
    where not exists (select 1 from skills where id = (s->>'skill_id')::int)
  ) or exists (
    select 1
    from jsonb_array_elements(p_roles) r,
         jsonb_array_elements_text(r->'optional_skill_ids') o
    where not exists (select 1 from skills where id = o::int)
  ) then
    raise exception 'VALIDATION' using errcode = 'P0001';
  end if;

  select coalesce(array_agg((r->>'id')::uuid), '{}') into v_ids
  from jsonb_array_elements(p_roles) r
  where r->>'id' is not null;

  if exists (
    select 1 from unnest(v_ids) i
    where not exists (select 1 from team_roles where id = i and team_id = p_team)
  ) then
    raise exception 'ROLE_NOT_FOUND' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from team_roles tr
    where tr.team_id = p_team
      and (select count(*) from team_members m where m.team_role_id = tr.id) > coalesce((
        select (r->>'slots')::int from jsonb_array_elements(p_roles) r
        where (r->>'id')::uuid = tr.id
      ), 0)
  ) then
    raise exception 'ROLE_HAS_MEMBERS' using errcode = 'P0001';
  end if;

  delete from team_roles where team_id = p_team and id <> all (v_ids);

  update team_roles tr set
    name               = r->>'name',
    description        = nullif(r->>'description', ''),
    color_key          = coalesce(r->>'color_key', 'other'),
    source             = (r->>'source')::role_source_t,
    source_page        = (r->>'source_page')::smallint,
    source_criterion   = r->>'source_criterion',
    edited             = coalesce((r->>'edited')::boolean, false),
    required_skills    = r->'required_skills',
    optional_skill_ids = coalesce(array(select jsonb_array_elements_text(r->'optional_skill_ids')::int), '{}'),
    hours_per_week     = (r->>'hours_per_week')::smallint,
    slots              = (r->>'slots')::smallint,
    sort               = (i - 1)::smallint
  from jsonb_array_elements(p_roles) with ordinality as t(r, i)
  where tr.id = (r->>'id')::uuid;

  insert into team_roles
    (team_id, name, description, color_key, source, source_page, source_criterion, edited,
     required_skills, optional_skill_ids, hours_per_week, slots, sort)
  select p_team, r->>'name', nullif(r->>'description', ''), coalesce(r->>'color_key', 'other'),
         (r->>'source')::role_source_t, (r->>'source_page')::smallint, r->>'source_criterion',
         coalesce((r->>'edited')::boolean, false), r->'required_skills',
         coalesce(array(select jsonb_array_elements_text(r->'optional_skill_ids')::int), '{}'),
         (r->>'hours_per_week')::smallint, (r->>'slots')::smallint, (i - 1)::smallint
  from jsonb_array_elements(p_roles) with ordinality as t(r, i)
  where r->>'id' is null;

  perform recompute_team_status(p_team);
  update teams set updated_at = now() where id = p_team;

  return array(select id from team_roles where team_id = p_team order by sort);
end $$;

revoke execute on function save_roles(uuid, jsonb) from public, anon;
grant execute on function save_roles(uuid, jsonb) to authenticated;
