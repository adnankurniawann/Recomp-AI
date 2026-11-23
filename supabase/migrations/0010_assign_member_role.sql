-- assign_member_role (PRD F-TEM-03, §13.1): the leader moves a member, themself included, to
-- another role of the team, then the team status is recomputed. Same lock order as 0009: every
-- role of the team, then the team.

create or replace function assign_member_role(p_team uuid, p_profile uuid, p_role uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := current_profile_id();
  v_team teams;
  v_role team_roles;
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

  select * into v_role from team_roles where id = p_role and team_id = p_team;
  if not found then
    raise exception 'ROLE_NOT_FOUND' using errcode = 'P0001';
  end if;
  if not exists (select 1 from team_members where team_id = p_team and profile_id = p_profile) then
    raise exception 'NOT_MEMBER' using errcode = 'P0001';
  end if;

  if (select count(*) from team_members
      where team_role_id = p_role and profile_id <> p_profile) >= v_role.slots then
    raise exception 'ROLE_FULL' using errcode = 'P0001';
  end if;

  update team_members set team_role_id = p_role where team_id = p_team and profile_id = p_profile;
  perform recompute_team_status(p_team);
  update teams set updated_at = now() where id = p_team;
end $$;

revoke execute on function assign_member_role(uuid, uuid, uuid) from public, anon;
grant execute on function assign_member_role(uuid, uuid, uuid) to authenticated;
