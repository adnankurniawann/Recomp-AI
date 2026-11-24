-- Mentor management in /admin/mentor (F-ADM-01, PRD §10.11).
-- save_mentor writes a mentor and its services in one transaction. Admins only. A service that
-- already has a booking can't be removed (bookings point at it); it raises SERVICE_IN_USE.
--
-- p_mentor:   {display_name, roles, headline, bio, competition_categories, verified, is_simulated,
--              is_active}
-- p_services: [{id?, name, description, duration_min, price}], services without an id are new.
-- p_id:       the mentor to edit; null adds a new one.

create or replace function save_mentor(p_mentor jsonb, p_services jsonb, p_id uuid default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id   uuid := p_id;
  v_keep uuid[];
  v_s    jsonb;
begin
  if not is_admin() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_mentor) <> 'object' or jsonb_typeof(p_services) <> 'array' then
    raise exception 'VALIDATION' using errcode = 'P0001';
  end if;

  if v_id is null then
    insert into mentors
      (display_name, roles, headline, bio, competition_categories, verified, is_simulated, is_active)
    values (
      p_mentor->>'display_name',
      array(select jsonb_array_elements_text(p_mentor->'roles')),
      p_mentor->>'headline',
      nullif(p_mentor->>'bio', ''),
      array(select jsonb_array_elements_text(p_mentor->'competition_categories'))::comp_category_t[],
      (p_mentor->>'verified')::boolean,
      (p_mentor->>'is_simulated')::boolean,
      (p_mentor->>'is_active')::boolean
    )
    returning id into v_id;
  else
    update mentors set
      display_name           = p_mentor->>'display_name',
      roles                  = array(select jsonb_array_elements_text(p_mentor->'roles')),
      headline               = p_mentor->>'headline',
      bio                    = nullif(p_mentor->>'bio', ''),
      competition_categories =
        array(select jsonb_array_elements_text(p_mentor->'competition_categories'))::comp_category_t[],
      verified               = (p_mentor->>'verified')::boolean,
      is_simulated           = (p_mentor->>'is_simulated')::boolean,
      is_active              = (p_mentor->>'is_active')::boolean
    where id = v_id;
    if not found then
      raise exception 'NOT_FOUND' using errcode = 'P0001';
    end if;
  end if;

  -- Services that stay: the ones sent with an id that belongs to this mentor.
  select coalesce(array_agg((s->>'id')::uuid), '{}') into v_keep
    from jsonb_array_elements(p_services) s
   where s ? 'id' and exists (
     select 1 from mentor_services ms where ms.id = (s->>'id')::uuid and ms.mentor_id = v_id
   );

  if exists (
    select 1 from bookings b join mentor_services ms on ms.id = b.service_id
     where ms.mentor_id = v_id and not ms.id = any(v_keep)
  ) then
    raise exception 'SERVICE_IN_USE' using errcode = 'P0001';
  end if;
  delete from mentor_services where mentor_id = v_id and not id = any(v_keep);

  for v_s in select * from jsonb_array_elements(p_services) loop
    if (v_s->>'id')::uuid = any(v_keep) then
      update mentor_services set
        name = v_s->>'name',
        description = nullif(v_s->>'description', ''),
        duration_min = (v_s->>'duration_min')::smallint,
        price = (v_s->>'price')::int
      where id = (v_s->>'id')::uuid;
    else
      insert into mentor_services (mentor_id, name, description, duration_min, price)
      values (
        v_id,
        v_s->>'name',
        nullif(v_s->>'description', ''),
        (v_s->>'duration_min')::smallint,
        (v_s->>'price')::int
      );
    end if;
  end loop;

  return v_id;
end $$;

revoke execute on function save_mentor(jsonb, jsonb, uuid) from public, anon;
grant execute on function save_mentor(jsonb, jsonb, uuid) to authenticated;
