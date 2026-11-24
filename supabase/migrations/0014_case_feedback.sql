-- Case-study answers (F-LRN-04, PRD §8.3, §12.4) and RLS on agent_actions (PRD §8.4, §14).

-- agent_actions had no RLS, so any signed-in student could read or write every row. Now a student
-- reads and writes only their own rows (the AI routes log as the signed-in user and count them for
-- the rate limit); admins read all of them for the metrics page.
alter table agent_actions enable row level security;

create policy "agent actions readable by actor or admin" on agent_actions
  for select to authenticated
  using (actor_id = (select current_profile_id()) or is_admin());

create policy "agent actions insertable by actor" on agent_actions
  for insert to authenticated
  with check (actor_id = (select current_profile_id()));

-- The recruiter marks its draft approved or rejected when the leader clicks (ADR 0004).
create policy "agent actions updatable by actor" on agent_actions
  for update to authenticated
  using (actor_id = (select current_profile_id()))
  with check (actor_id = (select current_profile_id()));

-- record_case_attempt: stores one graded answer, at most 3 per question -------------------------
-- p_score is total/max (0..1), shown back to the student. Points don't depend on it: the student
-- could call this function directly with any score, so the first answer earns the question's
-- points and later ones earn none (the course total stays honest).
-- Returns {attempt_no, points_awarded, lesson_completed}.

create or replace function record_case_attempt(
  p_question uuid,
  p_text     text,
  p_feedback jsonb,
  p_score    numeric
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me     uuid := current_profile_id();
  v_q      questions;
  v_text   text := trim(coalesce(p_text, ''));
  v_no     smallint;
  v_points smallint;
  v_done   boolean;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_q from questions where id = p_question;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_q.type <> 'case'
     or char_length(v_text) not between 1 and 2000
     or p_score is null or p_score not between 0 and 1
     or jsonb_typeof(p_feedback) <> 'object' then
    raise exception 'VALIDATION' using errcode = 'P0001';
  end if;
  if not lesson_is_open(v_q.lesson_id) then
    raise exception 'NO_ACCESS' using errcode = 'P0001';
  end if;

  select count(*) + 1 into v_no from attempts where profile_id = v_me and question_id = v_q.id;
  if v_no > 3 then
    raise exception 'MAX_ATTEMPTS' using errcode = 'P0001';
  end if;
  v_points := case when v_no = 1 then v_q.points else 0 end;

  begin
    insert into attempts
      (profile_id, question_id, answer, score, points_awarded, ai_feedback, attempt_no)
    values
      (v_me, v_q.id, jsonb_build_object('text', v_text), round(p_score, 3), v_points, p_feedback, v_no);
  exception
    -- attempts_one_per_number: two submissions raced for the same attempt number.
    when unique_violation then
      raise exception 'MAX_ATTEMPTS' using errcode = 'P0001';
  end;

  v_done := mark_lesson_if_done(v_q.lesson_id, v_me);

  return jsonb_build_object(
    'attempt_no',       v_no,
    'points_awarded',   v_points,
    'lesson_completed', v_done
  );
end $$;

revoke execute on function record_case_attempt(uuid, text, jsonb, numeric) from public, anon;
grant execute on function record_case_attempt(uuid, text, jsonb, numeric) to authenticated;
