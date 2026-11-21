-- Learning (PRD F-LRN-03, F-LRN-05, §12.3, §12.4): RLS on the course tables, who may open a lesson,
-- answering multiple-choice questions, progress, the promo code and the simulated purchase.
-- Errors raised for the app use errcode P0001 and the ActionResult code as the message.

-- Content: everyone reads courses, chapters and lessons; admins write. Content of a locked lesson is
-- held back by the server that renders it (PRD §12.3), using lesson_is_open below.

alter table courses enable row level security;
create policy "published courses readable by everyone" on courses
  for select using (is_published or is_admin());
create policy "courses writable by admin" on courses
  for all using (is_admin()) with check (is_admin());

alter table chapters enable row level security;
create policy "chapters readable by everyone" on chapters for select using (true);
create policy "chapters writable by admin" on chapters
  for all using (is_admin()) with check (is_admin());

alter table lessons enable row level security;
create policy "lessons readable by everyone" on lessons for select using (true);
create policy "lessons writable by admin" on lessons
  for all using (is_admin()) with check (is_admin());

-- Questions: answer_key never reaches a student (AGENTS.md domain rule 4). Only admins read the
-- table; everyone else reads questions_public, a view without answer_key and explanation_md that
-- runs as its owner and so is not filtered by this RLS.
alter table questions enable row level security;
create policy "questions readable and writable by admin" on questions
  for all using (is_admin()) with check (is_admin());

grant select on questions_public to anon, authenticated;

-- A student's own learning rows: they read them, SQL functions write them.
alter table attempts enable row level security;
create policy "attempts readable by owner" on attempts
  for select to authenticated using (profile_id = (select current_profile_id()));

alter table lesson_progress enable row level security;
create policy "lesson progress readable by owner" on lesson_progress
  for select to authenticated using (profile_id = (select current_profile_id()));

alter table course_access enable row level security;
create policy "course access readable by owner" on course_access
  for select to authenticated using (profile_id = (select current_profile_id()));

alter table promo_codes enable row level security;
create policy "promo codes for admin" on promo_codes
  for all using (is_admin()) with check (is_admin());

-- One attempt per number: a second multiple-choice answer (always attempt 1) or a race between
-- two case-study submissions fails here even if both passed the checks.
create unique index attempts_one_per_number on attempts (profile_id, question_id, attempt_no);

-- Access --------------------------------------------------------------------------------------

-- Free courses are open to everyone; paid ones need a course_access row (promo or simulated payment).
create or replace function has_course_access(p_course uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from courses where id = p_course and price = 0)
      or exists (
        select 1 from course_access
        where course_id = p_course and profile_id = current_profile_id()
      )
      or is_admin()
$$;

-- The first chapter is free (is_free_preview); the rest needs access (F-LRN-05).
create or replace function lesson_is_open(p_lesson uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select l.is_free_preview or has_course_access(c.course_id)
    from lessons l join chapters c on c.id = l.chapter_id
    where l.id = p_lesson
  ), false)
$$;

-- Mark a lesson done once every question in it has an attempt by the caller.
create or replace function mark_lesson_if_done(p_lesson uuid, p_profile uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_total    int;
  v_answered int;
begin
  select count(*) into v_total from questions where lesson_id = p_lesson;
  select count(distinct a.question_id) into v_answered
  from attempts a join questions q on q.id = a.question_id
  where q.lesson_id = p_lesson and a.profile_id = p_profile;

  if v_answered < v_total then
    return false;
  end if;
  insert into lesson_progress (profile_id, lesson_id) values (p_profile, p_lesson)
  on conflict do nothing;
  return true;
end $$;

-- submit_mcq: one answer per question; the key comes back only after answering (F-LRN-03) ---------
-- Returns {is_correct, answer_key, explanation_md, points_awarded, lesson_completed}.

create or replace function submit_mcq(p_question uuid, p_choice text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me      uuid := current_profile_id();
  v_q       questions;
  v_choice  text := upper(trim(coalesce(p_choice, '')));
  v_correct boolean;
  v_points  smallint;
  v_done    boolean;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_q from questions where id = p_question;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_q.type <> 'mcq' or not exists (
    select 1 from jsonb_array_elements(coalesce(v_q.options, '[]')) o where upper(o->>'key') = v_choice
  ) then
    raise exception 'VALIDATION' using errcode = 'P0001';
  end if;
  if not lesson_is_open(v_q.lesson_id) then
    raise exception 'NO_ACCESS' using errcode = 'P0001';
  end if;
  if exists (select 1 from attempts where profile_id = v_me and question_id = v_q.id) then
    raise exception 'ALREADY_ANSWERED' using errcode = 'P0001';
  end if;

  v_correct := v_choice = upper(v_q.answer_key);
  v_points  := case when v_correct then v_q.points else 0 end;

  begin
    insert into attempts (profile_id, question_id, answer, is_correct, score, points_awarded, attempt_no)
    values (v_me, v_q.id, jsonb_build_object('choice', v_choice), v_correct,
            case when v_correct then 1 else 0 end, v_points, 1);
  exception
    when unique_violation then
      raise exception 'ALREADY_ANSWERED' using errcode = 'P0001';
  end;

  v_done := mark_lesson_if_done(v_q.lesson_id, v_me);

  return jsonb_build_object(
    'is_correct',       v_correct,
    'answer_key',       v_q.answer_key,
    'explanation_md',   v_q.explanation_md,
    'points_awarded',   v_points,
    'lesson_completed', v_done
  );
end $$;

-- Answer keys and explanations of the questions in a lesson that the caller has already answered,
-- so the player can show them again after a reload. Unanswered questions never come back here.
create or replace function answered_question_keys(p_lesson uuid)
returns table (question_id uuid, answer_key text, explanation_md text)
language sql stable security definer set search_path = public as $$
  select q.id, q.answer_key, q.explanation_md
  from questions q
  where q.lesson_id = p_lesson
    and q.type = 'mcq'
    and exists (
      select 1 from attempts a where a.question_id = q.id and a.profile_id = current_profile_id()
    )
$$;

-- A lesson without questions is done once it has been scrolled to the end (F-LRN-03).
create or replace function complete_reading_lesson(p_lesson uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := current_profile_id();
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;
  if not exists (select 1 from lessons where id = p_lesson) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if not lesson_is_open(p_lesson) then
    raise exception 'NO_ACCESS' using errcode = 'P0001';
  end if;
  if exists (select 1 from questions where lesson_id = p_lesson) then
    raise exception 'VALIDATION' using errcode = 'P0001';
  end if;

  insert into lesson_progress (profile_id, lesson_id) values (v_me, p_lesson)
  on conflict do nothing;
end $$;

-- Progress of the caller in one course: the "3/27 latihan selesai" bar and the "120 poin" chip.
create or replace function course_progress(p_course uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with course_lessons as (
    select l.id from lessons l join chapters c on c.id = l.chapter_id where c.course_id = p_course
  ),
  course_questions as (
    select q.id from questions q where q.lesson_id in (select id from course_lessons)
  ),
  mine as (
    select a.question_id, a.points_awarded from attempts a
    where a.profile_id = current_profile_id() and a.question_id in (select id from course_questions)
  )
  select jsonb_build_object(
    'answered',          (select count(distinct question_id) from mine),
    'total_questions',   (select count(*) from course_questions),
    'points',            coalesce((select sum(points_awarded) from mine), 0),
    'completed_lessons', (select count(*) from lesson_progress
                          where profile_id = current_profile_id()
                            and lesson_id in (select id from course_lessons)),
    'total_lessons',     (select count(*) from course_lessons),
    'has_access',        has_course_access(p_course)
  )
$$;

-- Access: promo code and simulated purchase (F-LRN-05, [SIMULASI]) -------------------------------

-- Only full-discount codes are supported, as PENGGUNAAWAL is the only one planned; a partial
-- discount would need a price at checkout, which courses don't have yet.
create or replace function redeem_promo(p_code text, p_course uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := current_profile_id();
  v_promo promo_codes;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;
  if not exists (select 1 from courses where id = p_course and is_published) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if exists (select 1 from course_access where profile_id = v_me and course_id = p_course) then
    return; -- already open: don't spend the quota again
  end if;

  select * into v_promo from promo_codes where code = upper(trim(p_code)) for update;
  if not found
     or (v_promo.course_id is not null and v_promo.course_id <> p_course)
     or v_promo.discount_percent < 100 then
    raise exception 'INVALID_CODE' using errcode = 'P0001';
  end if;
  if v_promo.expires_at is not null and v_promo.expires_at < now() then
    raise exception 'EXPIRED' using errcode = 'P0001';
  end if;
  if v_promo.used >= v_promo.quota then
    raise exception 'QUOTA_EXCEEDED' using errcode = 'P0001';
  end if;

  insert into course_access (profile_id, course_id, source) values (v_me, p_course, 'promo');
  update promo_codes set used = used + 1 where code = v_promo.code;
end $$;

-- No money moves: the access is recorded as a simulated payment (ADR 0005).
create or replace function simulate_course_purchase(p_course uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := current_profile_id();
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;
  if not exists (select 1 from courses where id = p_course and is_published) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  insert into course_access (profile_id, course_id, source)
  values (v_me, p_course, 'simulated_payment')
  on conflict do nothing;
end $$;

-- Grants -------------------------------------------------------------------------------------------

revoke execute on function mark_lesson_if_done(uuid, uuid) from public, anon, authenticated;

revoke execute on function submit_mcq(uuid, text) from public, anon;
revoke execute on function complete_reading_lesson(uuid) from public, anon;
revoke execute on function course_progress(uuid) from public, anon;
revoke execute on function answered_question_keys(uuid) from public, anon;
revoke execute on function redeem_promo(text, uuid) from public, anon;
revoke execute on function simulate_course_purchase(uuid) from public, anon;

grant execute on function submit_mcq(uuid, text) to authenticated;
grant execute on function complete_reading_lesson(uuid) to authenticated;
grant execute on function course_progress(uuid) to authenticated;
grant execute on function answered_question_keys(uuid) to authenticated;
grant execute on function redeem_promo(text, uuid) to authenticated;
grant execute on function simulate_course_purchase(uuid) to authenticated;
