-- Mentors (PRD F-MNT-01..02, §12.3): RLS on mentors, their services and time slots, and their
-- contacts. Bookings and their payment functions belong to F-MNT-03 (#45).

-- Active mentors, their services and slots are public; admins manage them. Slots become booked
-- only through the booking functions, which run as their owner.

alter table mentors enable row level security;
create policy "active mentors readable by everyone" on mentors
  for select using (is_active or is_admin());
create policy "mentors writable by admin" on mentors
  for all using (is_admin()) with check (is_admin());

alter table mentor_services enable row level security;
create policy "services of active mentors readable by everyone" on mentor_services
  for select using (
    exists (select 1 from mentors m where m.id = mentor_id and (m.is_active or is_admin()))
  );
create policy "mentor services writable by admin" on mentor_services
  for all using (is_admin()) with check (is_admin());

alter table mentor_slots enable row level security;
create policy "slots of active mentors readable by everyone" on mentor_slots
  for select using (
    exists (select 1 from mentors m where m.id = mentor_id and (m.is_active or is_admin()))
  );
create policy "mentor slots writable by admin" on mentor_slots
  for all using (is_admin()) with check (is_admin());

-- Mentor contacts open only to members of a team with a paid booking with that mentor (ADR 0003).
alter table mentor_contacts enable row level security;
create policy "mentor contacts readable by teams that paid" on mentor_contacts
  for select to authenticated using (
    is_admin()
    or exists (
      select 1 from bookings b
      where b.mentor_id = mentor_contacts.mentor_id
        and b.status in ('paid', 'done')
        and is_team_member(b.team_id)
    )
  );
create policy "mentor contacts writable by admin" on mentor_contacts
  for all using (is_admin()) with check (is_admin());
