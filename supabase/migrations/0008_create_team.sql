-- create_team (PRD F-TEM-01, §12.4): the team, its roles and the leader as a member in one
-- transaction. team_members has no write policy (0004), so this is the only way a team starts.
-- Errors use errcode P0001 with the ActionResult code as the message.
--
-- p_roles is the validated RoleInput[] from tim/actions.ts in snake_case:
--   [{"name","description","color_key","source","source_page","source_criterion","edited",
--     "required_skills":[{"skill_id","min_level"}],"optional_skill_ids","hours_per_week","slots"}]
-- p_leader_role_index is 0-based into p_roles.

create or replace function create_team(
  p_competition       uuid,
  p_name              text,
  p_goal              goal_t,
  p_work_time         work_time_t,
  p_roles             jsonb,
  p_leader_role_index int,
  p_extraction        uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me       uuid := current_profile_id();
  v_team_max smallint;
  v_team     uuid;
  v_leader   uuid;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select team_max into v_team_max from competitions where id = p_competition and is_published;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if exists (select 1 from team_members where competition_id = p_competition and profile_id = v_me) then
    raise exception 'ALREADY_HAS_TEAM' using errcode = 'P0001';
  end if;

  if jsonb_typeof(p_roles) <> 'array' or jsonb_array_length(p_roles) not between 1 and 6
     or p_leader_role_index not between 0 and jsonb_array_length(p_roles) - 1 then
    raise exception 'VALIDATION' using errcode = 'P0001';
  end if;

  if (select sum((r->>'slots')::int) from jsonb_array_elements(p_roles) r) > v_team_max then
    raise exception 'SLOTS_EXCEED_MAX' using errcode = 'P0001';
  end if;

  -- required_skills is jsonb, so no foreign key catches an unknown skill id.
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

  if p_extraction is not null
     and not exists (select 1 from competition_extractions where id = p_extraction and competition_id = p_competition) then
    p_extraction := null;
  end if;

  insert into teams (competition_id, leader_id, name, goal, work_time, extraction_id)
  values (p_competition, v_me, p_name, p_goal, p_work_time, p_extraction)
  returning id into v_team;

  insert into team_roles
    (team_id, name, description, color_key, source, source_page, source_criterion, edited,
     required_skills, optional_skill_ids, hours_per_week, slots, sort)
  select v_team, r->>'name', nullif(r->>'description', ''), coalesce(r->>'color_key', 'other'),
         (r->>'source')::role_source_t, (r->>'source_page')::smallint, r->>'source_criterion',
         coalesce((r->>'edited')::boolean, false), r->'required_skills',
         coalesce(array(select jsonb_array_elements_text(r->'optional_skill_ids')::int), '{}'),
         (r->>'hours_per_week')::smallint, (r->>'slots')::smallint, (i - 1)::smallint
  from jsonb_array_elements(p_roles) with ordinality as t(r, i);

  select id into v_leader from team_roles where team_id = v_team and sort = p_leader_role_index;

  insert into team_members (team_id, profile_id, competition_id, team_role_id, is_leader)
  values (v_team, v_me, p_competition, v_leader, true);

  perform recompute_team_status(v_team);
  return v_team;
exception
  -- teams (competition_id, leader_id) or team_members (competition_id, profile_id): a second
  -- create for the same competition raced past the check above.
  when unique_violation then
    raise exception 'ALREADY_HAS_TEAM' using errcode = 'P0001';
end $$;

revoke execute on function create_team(uuid, text, goal_t, work_time_t, jsonb, int, uuid) from public, anon;
grant execute on function create_team(uuid, text, goal_t, work_time_t, jsonb, int, uuid) to authenticated;
