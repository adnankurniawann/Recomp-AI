-- Ranking candidates (PRD §7.2, §12.4, F-RNK-01, F-RNK-04).
-- ranking_candidates returns everything the score needs in one call: the role, the team context,
-- the active matching_config, skill names, and every profile that passes filters 1 to 6 of
-- PRD §7.2. Scoring, filter 7 and the order run in TypeScript (`lib/ranking/build.ts`, ADR 0002),
-- so limit and offset are applied there, after the sort, not here.
--
-- Banned attributes (PRD §7.3): the JSON carries campus, major and entry year only so the UI can
-- show them. lib/ranking/build.ts never passes them to the score.

create or replace function ranking_candidates(p_team_role uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_me     uuid := current_profile_id();
  v_role   team_roles;
  v_team   teams;
  v_comp   competitions;
  v_req    int[];
  v_result jsonb;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_role from team_roles where id = p_team_role;
  if not found then
    raise exception 'ROLE_NOT_FOUND' using errcode = 'P0001';
  end if;
  select * into v_team from teams where id = v_role.team_id;
  if not exists (select 1 from team_members where team_id = v_team.id and profile_id = v_me) then
    raise exception 'NOT_MEMBER' using errcode = 'P0001';
  end if;
  select * into v_comp from competitions where id = v_team.competition_id;

  select coalesce(array_agg((s->>'skill_id')::int), '{}')
    into v_req
    from jsonb_array_elements(v_role.required_skills) s;

  select jsonb_build_object(
    'role', jsonb_build_object(
      'id',                 v_role.id,
      'name',               v_role.name,
      'color_key',          v_role.color_key,
      'required_skills',    v_role.required_skills,
      'optional_skill_ids', to_jsonb(v_role.optional_skill_ids),
      'hours_per_week',     v_role.hours_per_week
    ),
    'team', jsonb_build_object(
      'goal',      v_team.goal,
      'work_time', v_team.work_time,
      'category',  v_comp.category
    ),
    'config', (
      select jsonb_build_object(
        'weights',            c.weights,
        'no_evidence_factor', c.no_evidence_factor,
        'optional_bonus',     c.optional_bonus,
        'experience_cap',     c.experience_cap,
        'podium_bonus',       c.podium_bonus
      )
      from matching_config c where c.active
    ),
    'skill_names', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name))
      from skills s where s.id = any(v_req || v_role.optional_skill_ids)
    ), '[]'),
    'candidates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',              p.id,
        'username',        p.username,
        'full_name',       p.full_name,
        'avatar_url',      p.avatar_url,
        'campus',          p.campus,
        'major',           p.major,
        'entry_year',      p.entry_year,
        'preferred_roles', to_jsonb(p.preferred_roles),
        'is_simulated',    p.is_simulated,
        'hours_per_week',  p.hours_per_week,
        'goal',            p.goal,
        'work_time',       p.work_time,
        'updated_at',      p.updated_at,
        'skills', coalesce((
          select jsonb_agg(jsonb_build_object(
            'skill_id',     ps.skill_id,
            'level',        ps.level,
            'has_evidence', ps.evidence_url is not null and ps.evidence_url <> ''
          ))
          from profile_skills ps where ps.profile_id = p.id
        ), '[]'),
        'history', coalesce((
          select jsonb_agg(jsonb_build_object('category', h.category, 'result', h.result))
          from competition_history h where h.profile_id = p.id
        ), '[]')
      ))
      from profiles p
      where p.username is not null
        -- 1. interested in this competition
        and exists (
          select 1 from competition_interests ci
          where ci.profile_id = p.id and ci.competition_id = v_comp.id
        )
        -- 2. open to invites and onboarded
        and p.open_to_invite and p.onboarding_done
        -- 3. no team in this competition (which also covers 4. not a member of this team)
        and not exists (
          select 1 from team_members m
          where m.competition_id = v_comp.id and m.profile_id = p.id
        )
        -- 5. never declined this team and no pending invite from it
        and not exists (
          select 1 from invites i
          where i.team_id = v_team.id and i.candidate_id = p.id
            and i.status in ('pending', 'declined')
        )
        -- 6. competitions.eligibility (e.g. {"degree":["S1"]}) can't be checked yet: profiles
        --    have no degree column. Add the check here when they do.
        -- 7. runs in TypeScript; this only drops profiles with none of the required skills early.
        and exists (
          select 1 from profile_skills ps
          where ps.profile_id = p.id and ps.skill_id = any(v_req)
        )
    ), '[]')
  ) into v_result;

  return v_result;
end $$;

revoke execute on function ranking_candidates(uuid) from public, anon;
grant execute on function ranking_candidates(uuid) to authenticated;
