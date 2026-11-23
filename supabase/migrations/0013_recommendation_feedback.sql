-- "Cocok" and "Kurang cocok" on a ranked candidate (F-RNK-05, PRD §12.3, §17).
-- One row per role and candidate: the latest choice of any team member wins. The score and
-- factors shown at that moment are kept with it for the trial metrics.

alter table recommendation_feedback enable row level security;

create policy "recommendation feedback readable by team members" on recommendation_feedback
  for select to authenticated
  using (exists (
    select 1 from team_roles r where r.id = team_role_id and is_team_member(r.team_id)
  ));
-- No write policies: writes go through submit_recommendation_feedback.

create or replace function submit_recommendation_feedback(
  p_team_role uuid,
  p_candidate uuid,
  p_score     smallint,
  p_factors   jsonb,
  p_feedback  feedback_t
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := current_profile_id();
  v_team uuid;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select team_id into v_team from team_roles where id = p_team_role;
  if v_team is null then
    raise exception 'ROLE_NOT_FOUND' using errcode = 'P0001';
  end if;
  if not exists (select 1 from team_members where team_id = v_team and profile_id = v_me) then
    raise exception 'NOT_MEMBER' using errcode = 'P0001';
  end if;
  if not exists (select 1 from profiles where id = p_candidate) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if p_score not between 0 and 100 or jsonb_typeof(p_factors) <> 'object' then
    raise exception 'VALIDATION' using errcode = 'P0001';
  end if;

  insert into recommendation_feedback
    (team_role_id, candidate_id, score, factors, feedback, created_by)
  values
    (p_team_role, p_candidate, p_score, p_factors, p_feedback, v_me)
  on conflict (team_role_id, candidate_id) do update
    set score = excluded.score,
        factors = excluded.factors,
        feedback = excluded.feedback,
        created_by = excluded.created_by,
        created_at = now();
end $$;

revoke execute on function submit_recommendation_feedback(uuid, uuid, smallint, jsonb, feedback_t)
  from public, anon;
grant execute on function submit_recommendation_feedback(uuid, uuid, smallint, jsonb, feedback_t)
  to authenticated;
