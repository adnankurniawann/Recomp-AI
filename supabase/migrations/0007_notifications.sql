-- Notifications (PRD F-NTF-01, §12.3): the owner reads their own rows and marks them read; rows are
-- written only by the SQL functions that cause them (send_invite, accept_invite, decline_invite and,
-- later, simulate_booking_payment), which run as security definer and so skip these policies.

alter table notifications enable row level security;

create policy "notifications readable by owner" on notifications
  for select to authenticated using (profile_id = (select current_profile_id()));

-- No insert, update or delete policy: marking read goes through the function below, so a student
-- can never change a notification's type or payload.

-- Newest first for the bell dropdown.
create index notifications_by_owner on notifications (profile_id, created_at desc);

-- mark_notifications_read: sets read_at on the caller's own unread rows among p_ids, or on all of
-- them when p_ids is null (opening the bell clears the badge, even past the 10 it shows). Ids that
-- are not the caller's are ignored, not an error. Returns how many rows changed.
create or replace function mark_notifications_read(p_ids uuid[]) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := current_profile_id();
  v_count int;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  update notifications set read_at = now()
  where profile_id = v_me and read_at is null and (p_ids is null or id = any(p_ids));
  get diagnostics v_count = row_count;
  return v_count;
end $$;

revoke execute on function mark_notifications_read(uuid[]) from public, anon;
grant execute on function mark_notifications_read(uuid[]) to authenticated;
