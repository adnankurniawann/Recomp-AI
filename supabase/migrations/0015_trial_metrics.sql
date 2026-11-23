-- Trial metrics for /admin/metrik (F-ADM-01, PRD §17).
--
-- events: a small log for what no other table records. Today only `ranking_viewed`, written by
-- GET /api/ranking when a team member opens a role's ranking (the first page).
create table events (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  team_id    uuid references teams(id) on delete cascade,
  type       text not null check (type in ('ranking_viewed')),
  created_at timestamptz not null default now()
);
create index events_team_type on events(team_id, type, created_at);

alter table events enable row level security;
create policy "events insertable by the actor" on events
  for insert to authenticated
  with check (profile_id = (select current_profile_id()));
create policy "events readable by admin" on events
  for select to authenticated using (is_admin());

-- trial_metrics: the six numbers of PRD §17 as numerator and denominator, split into real and
-- simulated data. Admins only; it returns counts, never names or contacts.
--
-- What counts as simulated: a team whose leader is a simulated profile; feedback and invites whose
-- candidate is simulated; agent runs by a simulated actor.
-- - Time to the candidate list: per team, the first ranking_viewed minus teams.created_at.
-- - Leader intervention: for teams started from an extraction, (roles edited + suggested roles
--   removed) / suggested roles; for teams started from templates, edited / template roles.
-- - Drafts sent: drafts the leader sent / drafts the recruiter wrote (agent_actions.output).
-- - Extraction accuracy comes from `pnpm eval:guidebook`, not from this function.
create or replace function trial_metrics() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_result jsonb := '{}';
  v_sim    boolean;
begin
  if not is_admin() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  foreach v_sim in array array[false, true] loop
    v_result := v_result || jsonb_build_object(
      case when v_sim then 'simulated' else 'real' end,
      jsonb_build_object(
        'participants', (
          select count(*) from profiles
          where onboarding_done and is_simulated = v_sim
        ),
        'teams', (
          select count(*) from teams t join profiles l on l.id = t.leader_id
          where l.is_simulated = v_sim
        ),
        'minutes_to_ranking', (
          select coalesce(jsonb_agg(m order by m), '[]')
          from (
            select round(extract(epoch from (min(e.created_at) - t.created_at)) / 60.0, 1) as m
            from teams t
            join profiles l on l.id = t.leader_id
            join events e on e.team_id = t.id and e.type = 'ranking_viewed'
            where l.is_simulated = v_sim
            group by t.id, t.created_at
          ) per_team
        ),
        'feedback', (
          select jsonb_build_object(
            'fit',     count(*) filter (where f.feedback = 'fit'),
            'not_fit', count(*) filter (where f.feedback = 'not_fit')
          )
          from recommendation_feedback f join profiles c on c.id = f.candidate_id
          where c.is_simulated = v_sim
        ),
        'invites', (
          select jsonb_build_object(
            'accepted', count(*) filter (where i.status = 'accepted'),
            'declined', count(*) filter (where i.status = 'declined'),
            'expired',  count(*) filter (where i.status = 'expired'),
            'pending',  count(*) filter (where i.status = 'pending')
          )
          from invites i join profiles c on c.id = i.candidate_id
          where c.is_simulated = v_sim
        ),
        'intervention', (
          select jsonb_build_object(
            'changed',   coalesce(sum(changed), 0),
            'suggested', coalesce(sum(suggested), 0)
          )
          from (
            select
              case when x.id is not null
                then coalesce(jsonb_array_length(x.data->'roles'), 0)
                else count(r.id) filter (where r.source <> 'manual')
              end as suggested,
              count(r.id) filter (where r.source <> 'manual' and r.edited)
                + case when x.id is not null
                    then greatest(
                      coalesce(jsonb_array_length(x.data->'roles'), 0)
                        - count(r.id) filter (where r.source <> 'manual'),
                      0)
                    else 0
                  end as changed
            from teams t
            join profiles l on l.id = t.leader_id
            left join competition_extractions x on x.id = t.extraction_id
            left join team_roles r on r.team_id = t.id
            where l.is_simulated = v_sim
            group by t.id, x.id, x.data
          ) per_team
        ),
        'drafts', (
          select jsonb_build_object(
            'sent', coalesce(sum((
              select count(*) from jsonb_each_text(coalesce(a.output->'decisions', '{}')) d
              where d.value = 'sent'
            )), 0),
            'total', coalesce(sum(jsonb_array_length(coalesce(a.output->'drafts', '[]'))), 0)
          )
          from agent_actions a join profiles p on p.id = a.actor_id
          where a.agent = 'recruiter' and p.is_simulated = v_sim
        )
      )
    );
  end loop;

  return v_result;
end $$;

revoke execute on function trial_metrics() from public, anon;
grant execute on function trial_metrics() to authenticated;
