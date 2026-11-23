-- Mentor bookings and the simulated payment (PRD F-MNT-03..04, §12.4, §13.1).
--
-- RLS: members of the team (and admins) read its bookings. Nobody writes them directly; the two
-- functions below run as their owner. Lock order in both: the slot, then the booking.

alter table bookings enable row level security;

create policy "bookings readable by the team" on bookings
  for select to authenticated using (is_team_member(team_id) or is_admin());

-- A booking that waited this long for payment frees its slot for the next team.
create or replace function booking_hold() returns interval
language sql immutable as $$ select interval '15 minutes' $$;

-- create_booking: a member books one slot of a mentor's service for their team. The booking waits
-- for payment with the price split 80/20. Calling it again for the same team, service and slot
-- returns the waiting booking, so a double click doesn't fail.
create or replace function create_booking(p_team uuid, p_service uuid, p_slot uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me      uuid := current_profile_id();
  v_team    teams;
  v_service mentor_services;
  v_slot    mentor_slots;
  v_old     bookings;
  v_fee     int;
  v_id      uuid;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_slot from mentor_slots where id = p_slot for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into v_team from teams where id = p_team;
  if not found or not is_team_member(p_team) then
    raise exception 'NOT_MEMBER' using errcode = 'P0001';
  end if;
  if v_team.status = 'archived' then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select s.* into v_service from mentor_services s
  join mentors m on m.id = s.mentor_id and m.is_active
  where s.id = p_service;
  if not found or v_service.mentor_id <> v_slot.mentor_id then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_slot.is_booked or v_slot.starts_at <= now() then
    raise exception 'SLOT_TAKEN' using errcode = 'P0001';
  end if;

  select * into v_old from bookings where slot_id = p_slot for update;
  if found then
    if v_old.team_id = p_team and v_old.service_id = p_service
       and v_old.status = 'pending_payment' then
      return v_old.id;
    end if;
    if v_old.status = 'pending_payment' and v_old.created_at < now() - booking_hold() then
      delete from bookings where id = v_old.id;
    else
      raise exception 'SLOT_TAKEN' using errcode = 'P0001';
    end if;
  end if;

  v_fee := round(v_service.price * 0.2);
  insert into bookings
    (team_id, booked_by, mentor_id, service_id, slot_id, price, platform_fee, mentor_share)
  values
    (p_team, v_me, v_service.mentor_id, v_service.id, p_slot, v_service.price, v_fee,
     v_service.price - v_fee)
  returning id into v_id;
  return v_id;
end $$;

-- simulate_booking_payment: a member pays the waiting booking (simulated). The booking becomes
-- paid, the slot taken, and every member of the team gets a notification.
create or replace function simulate_booking_payment(p_booking uuid) returns booking_status_t
language plpgsql security definer set search_path = public as $$
declare
  v_me  uuid := current_profile_id();
  v_bk  bookings;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  perform 1 from mentor_slots where id = (select slot_id from bookings where id = p_booking)
    for update;
  select * into v_bk from bookings where id = p_booking for update;
  if not found or not is_team_member(v_bk.team_id) then
    raise exception 'NOT_MEMBER' using errcode = 'P0001';
  end if;
  if v_bk.status in ('paid', 'done') then
    raise exception 'ALREADY_PAID' using errcode = 'P0001';
  end if;
  if v_bk.status = 'cancelled' then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  update bookings set status = 'paid', paid_at = now() where id = v_bk.id;
  update mentor_slots set is_booked = true where id = v_bk.slot_id;

  insert into notifications (profile_id, type, payload)
  select tm.profile_id, 'booking_paid', jsonb_build_object(
    'booking_id',    v_bk.id,
    'team_id',       v_bk.team_id,
    'mentor_id',     v_bk.mentor_id,
    'mentor_name',   (select display_name from mentors where id = v_bk.mentor_id),
    'service_title', (select name from mentor_services where id = v_bk.service_id)
  )
  from team_members tm where tm.team_id = v_bk.team_id;

  return 'paid';
end $$;

revoke execute on function create_booking(uuid, uuid, uuid) from public, anon;
grant execute on function create_booking(uuid, uuid, uuid) to authenticated;
revoke execute on function simulate_booking_payment(uuid) from public, anon;
grant execute on function simulate_booking_payment(uuid) to authenticated;
