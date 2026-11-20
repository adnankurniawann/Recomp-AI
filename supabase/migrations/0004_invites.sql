-- Invites (PRD §5.3, F-INV-01..03, §12.4): RLS on `invites` and the SQL functions that change them.
-- Every change goes through a security definer function, so there are no write policies.
-- Errors raised for the app use errcode P0001 and the ActionResult code as the message.
--
-- Lock order, to stay free of deadlocks: team role first, then invites. accept_invite locks the
-- role before its own invite because it may expire other pending invites for that role.

-- Team status from its roles (PRD §5.2). Also owned by the team work (#25); same rule either way.
create or replace function recompute_team_status(p_team uuid) returns team_status_t
language plpgsql security definer set search_path = public as $$
declare
  v_current team_status_t;
  v_next    team_status_t;
begin
  select status into v_current from teams where id = p_team for update;
  if v_current is null or v_current = 'archived' then
    return v_current;
  end if;

  v_next := case
    when not exists (select 1 from team_roles where team_id = p_team) then 'forming'
    when exists (
      select 1 from team_roles r
      where r.team_id = p_team
        and r.slots > (select count(*) from team_members m where m.team_role_id = r.id)
    ) then 'forming'
    else 'complete'
  end;

  if v_next is distinct from v_current then
    update teams set status = v_next, updated_at = now() where id = p_team;
  end if;
  return v_next;
end $$;

-- RLS on the team tables (PRD §12.3) ------------------------------------------------------------
-- Contacts open between teammates (are_teammates reads team_members), so nobody may write
-- team_members through the API: rows come only from create_team, accept_invite, leave_team and
-- remove_member. Without this a student could add themselves to any team and read its contacts.

alter table team_members enable row level security;

create policy "team members readable by everyone" on team_members
  for select using (true);

-- Teams: forming teams are public (name, competition, open roles); members see their team in any
-- status; a candidate sees the team of an invite addressed to them.
alter table teams enable row level security;

create policy "teams readable when forming, by members, or by invited candidates" on teams
  for select using (
    status = 'forming'
    or is_team_member(id)
    or exists (
      select 1 from invites i
      where i.team_id = teams.id and i.candidate_id = (select current_profile_id())
    )
  );

create policy "teams insertable by their leader" on teams
  for insert to authenticated
  with check (leader_id = (select current_profile_id()));

create policy "teams updatable by their leader" on teams
  for update to authenticated
  using (leader_id = (select current_profile_id()))
  with check (leader_id = (select current_profile_id()));

alter table team_roles enable row level security;

create policy "team roles readable by everyone" on team_roles
  for select using (true);

create policy "team roles writable by the team leader" on team_roles
  for all to authenticated
  using (exists (
    select 1 from teams t where t.id = team_id and t.leader_id = (select current_profile_id())
  ))
  with check (exists (
    select 1 from teams t where t.id = team_id and t.leader_id = (select current_profile_id())
  ));

-- RLS: the candidate, the sender and the team's members read an invite ----------------------

alter table invites enable row level security;

create policy "invites readable by the people involved" on invites
  for select to authenticated
  using (
    candidate_id = (select current_profile_id())
    or created_by = (select current_profile_id())
    or is_team_member(team_id)
  );

-- send_invite: the leader invites a candidate to one role (F-INV-01) ---------------------------

create or replace function send_invite(
  p_team_role    uuid,
  p_candidate    uuid,
  p_message      text,
  p_ai_drafted   boolean default false,
  p_agent_action uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me     uuid := current_profile_id();
  v_role   team_roles;
  v_team   teams;
  v_filled int;
  v_id     uuid;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_role from team_roles where id = p_team_role for update;
  if not found then
    raise exception 'ROLE_NOT_FOUND' using errcode = 'P0001';
  end if;
  select * into v_team from teams where id = v_role.team_id;

  if v_team.leader_id <> v_me then
    raise exception 'NOT_LEADER' using errcode = 'P0001';
  end if;
  if v_team.status = 'archived' or p_candidate = v_me then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if not exists (select 1 from profiles where id = p_candidate and onboarding_done) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  select count(*) into v_filled from team_members where team_role_id = v_role.id;
  if v_filled >= v_role.slots then
    raise exception 'ROLE_FULL' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from team_members
    where competition_id = v_team.competition_id and profile_id = p_candidate
  ) then
    raise exception 'CANDIDATE_HAS_TEAM' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from invites
    where team_id = v_team.id and candidate_id = p_candidate and status = 'pending'
  ) then
    raise exception 'ALREADY_PENDING' using errcode = 'P0001';
  end if;

  insert into invites
    (team_id, team_role_id, candidate_id, created_by, direction, message, ai_drafted, agent_action_id)
  values
    (v_team.id, v_role.id, p_candidate, v_me, 'invite', p_message, coalesce(p_ai_drafted, false), p_agent_action)
  returning id into v_id;

  insert into notifications (profile_id, type, payload)
  values (p_candidate, 'invite_received', jsonb_build_object(
    'invite_id', v_id,
    'team_id',   v_team.id,
    'team_name', v_team.name,
    'role_name', v_role.name,
    'from_name', (select full_name from profiles where id = v_me)
  ));

  return v_id;
exception
  -- invites_one_pending: a second send for the same pair raced past the check above.
  when unique_violation then
    raise exception 'ALREADY_PENDING' using errcode = 'P0001';
end $$;

-- accept_invite: one transaction, so two people never fill the last slot (F-INV-03) ------------
-- Returns the team id.

create or replace function accept_invite(p_invite uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me     uuid := current_profile_id();
  v_inv    invites;
  v_team   teams;
  v_role   team_roles;
  v_filled int;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  -- Find the role without a lock, lock it, then lock and re-read the invite (lock order above).
  select * into v_inv from invites where id = p_invite;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  select * into v_role from team_roles where id = v_inv.team_role_id for update;
  select * into v_inv from invites where id = p_invite for update;
  select * into v_team from teams where id = v_inv.team_id;

  -- The candidate answers an invite; the leader answers an application (Final Day).
  if not (
    (v_inv.direction = 'invite' and v_inv.candidate_id = v_me)
    or (v_inv.direction = 'apply' and v_team.leader_id = v_me)
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select count(*) into v_filled from team_members where team_role_id = v_role.id;

  if v_inv.status = 'expired' and v_filled >= v_role.slots then
    raise exception 'ROLE_FULL' using errcode = 'P0001';
  end if;
  if v_inv.status <> 'pending' or v_inv.created_at < now() - interval '7 days' then
    raise exception 'NOT_PENDING' using errcode = 'P0001';
  end if;
  if v_team.status = 'archived' then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if v_filled >= v_role.slots then
    raise exception 'ROLE_FULL' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from team_members
    where competition_id = v_team.competition_id and profile_id = v_inv.candidate_id
  ) then
    raise exception 'HAS_TEAM' using errcode = 'P0001';
  end if;

  begin
    insert into team_members (team_id, profile_id, competition_id, team_role_id, is_leader)
    values (v_team.id, v_inv.candidate_id, v_team.competition_id, v_role.id, false);
  exception
    -- team_members (competition_id, profile_id): the same student accepted another team's
    -- invite for this competition at the same moment.
    when unique_violation then
      raise exception 'HAS_TEAM' using errcode = 'P0001';
  end;

  update invites set status = 'accepted', responded_at = now() where id = v_inv.id;

  -- The role is full now: other pending invites for it can no longer be accepted (PRD §5.3).
  if v_filled + 1 >= v_role.slots then
    update invites set status = 'expired'
    where team_role_id = v_role.id and status = 'pending' and id <> v_inv.id;
  end if;

  perform recompute_team_status(v_team.id);

  insert into notifications (profile_id, type, payload)
  values (v_inv.created_by, 'invite_accepted', jsonb_build_object(
    'invite_id',      v_inv.id,
    'team_id',        v_team.id,
    'team_name',      v_team.name,
    'role_name',      v_role.name,
    'candidate_name', (select full_name from profiles where id = v_inv.candidate_id)
  ));

  return v_team.id;
end $$;

-- decline_invite: the candidate says no; they leave this team's ranking (F-INV-03) -------------
-- Returns the team id.

create or replace function decline_invite(p_invite uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := current_profile_id();
  v_inv  invites;
  v_team teams;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_inv from invites where id = p_invite for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  select * into v_team from teams where id = v_inv.team_id;

  if not (
    (v_inv.direction = 'invite' and v_inv.candidate_id = v_me)
    or (v_inv.direction = 'apply' and v_team.leader_id = v_me)
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if v_inv.status <> 'pending' then
    raise exception 'NOT_PENDING' using errcode = 'P0001';
  end if;

  update invites set status = 'declined', responded_at = now() where id = v_inv.id;

  insert into notifications (profile_id, type, payload)
  values (v_inv.created_by, 'invite_declined', jsonb_build_object(
    'invite_id',      v_inv.id,
    'team_id',        v_team.id,
    'team_name',      v_team.name,
    'role_name',      (select name from team_roles where id = v_inv.team_role_id),
    'candidate_name', (select full_name from profiles where id = v_inv.candidate_id)
  ));

  return v_team.id;
end $$;

-- cancel_invite: only the sender, only while pending (F-INV-06) --------------------------------

create or replace function cancel_invite(p_invite uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me  uuid := current_profile_id();
  v_inv invites;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_inv from invites where id = p_invite for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_inv.created_by <> v_me then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if v_inv.status <> 'pending' then
    raise exception 'NOT_PENDING' using errcode = 'P0001';
  end if;

  update invites set status = 'cancelled', responded_at = now() where id = v_inv.id;
end $$;

-- Grants ----------------------------------------------------------------------------------------
-- recompute_team_status is internal: only other functions call it.

revoke execute on function recompute_team_status(uuid) from public, anon, authenticated;

revoke execute on function send_invite(uuid, uuid, text, boolean, uuid) from public, anon;
revoke execute on function accept_invite(uuid) from public, anon;
revoke execute on function decline_invite(uuid) from public, anon;
revoke execute on function cancel_invite(uuid) from public, anon;

grant execute on function send_invite(uuid, uuid, text, boolean, uuid) to authenticated;
grant execute on function accept_invite(uuid) to authenticated;
grant execute on function decline_invite(uuid) to authenticated;
grant execute on function cancel_invite(uuid) to authenticated;
