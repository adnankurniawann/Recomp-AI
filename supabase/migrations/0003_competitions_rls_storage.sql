-- RLS for competitions and the reference tables seeded with them (PRD §12.3), and the Storage
-- buckets (PRD §11.2, §14).
--
-- Tables: skills, role_templates, matching_config, competitions, competition_extractions,
-- competition_interests. Buckets: guidebooks, posters, portfolio, mentors.

-- Reference data: everyone reads, admins write -------------------------------------------------

alter table skills enable row level security;
create policy "skills readable by everyone" on skills for select using (true);
create policy "skills writable by admin" on skills
  for all using (is_admin()) with check (is_admin());

alter table role_templates enable row level security;
create policy "role templates readable by everyone" on role_templates for select using (true);
create policy "role templates writable by admin" on role_templates
  for all using (is_admin()) with check (is_admin());

-- Weights live here, never in code (AGENTS.md). Reading them is harmless: the formula is public.
alter table matching_config enable row level security;
create policy "matching config readable by everyone" on matching_config for select using (true);
create policy "matching config writable by admin" on matching_config
  for all using (is_admin()) with check (is_admin());

-- competitions -----------------------------------------------------------------------------------

alter table competitions enable row level security;

create policy "published competitions readable by everyone" on competitions
  for select using (is_published or is_admin());

create policy "competitions writable by admin" on competitions
  for all using (is_admin()) with check (is_admin());

-- competition_extractions ------------------------------------------------------------------------
-- The public sees a result once the agent produced it (draft) or an admin approved it (reviewed).
-- /api/ai/guidebook writes under the admin's own session, so admin policies are enough.

alter table competition_extractions enable row level security;

create policy "finished extractions readable by everyone" on competition_extractions
  for select using (status in ('draft', 'reviewed') or is_admin());

create policy "extractions writable by admin" on competition_extractions
  for all using (is_admin()) with check (is_admin());

-- competition_interests --------------------------------------------------------------------------
-- Everyone reads, for the "24 mahasiswa tertarik" count. A student marks only their own interest,
-- and only on a published competition. Only interested students reach the ranking (F-CMP-03).

alter table competition_interests enable row level security;

create policy "interests readable by everyone" on competition_interests
  for select using (true);

create policy "interests insertable by owner" on competition_interests
  for insert with check (
    profile_id = current_profile_id()
    and exists (select 1 from competitions c where c.id = competition_id and c.is_published)
  );

create policy "interests deletable by owner" on competition_interests
  for delete using (profile_id = current_profile_id());

-- Storage buckets --------------------------------------------------------------------------------
-- All four are public to read: guidebooks are official documents with a download button on the
-- competition page, the rest are pictures shown on public pages. Size and type are enforced by
-- Storage itself; server actions check them again (PRD §14).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('guidebooks', 'guidebooks', true, 20971520, '{application/pdf}'),
  ('posters',    'posters',    true,  2097152, '{image/png,image/jpeg,image/webp}'),
  ('portfolio',  'portfolio',  true,  2097152, '{image/png,image/jpeg,image/webp}'),
  ('mentors',    'mentors',    true,  2097152, '{image/png,image/jpeg,image/webp}')
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets serve files by URL without a select policy; this one lets the API list and
-- download them too (the guidebook agent downloads through the API).
create policy "recomp buckets readable by everyone" on storage.objects
  for select using (bucket_id in ('guidebooks', 'posters', 'portfolio', 'mentors'));

create policy "admin writes guidebooks, posters and mentor photos" on storage.objects
  for insert with check (bucket_id in ('guidebooks', 'posters', 'mentors') and is_admin());
create policy "admin updates guidebooks, posters and mentor photos" on storage.objects
  for update using (bucket_id in ('guidebooks', 'posters', 'mentors') and is_admin());
create policy "admin deletes guidebooks, posters and mentor photos" on storage.objects
  for delete using (bucket_id in ('guidebooks', 'posters', 'mentors') and is_admin());

-- Portfolio covers go under the owner's profile id: `portfolio/<profile_id>/<file>`.
create policy "owner writes own portfolio covers" on storage.objects
  for insert with check (
    bucket_id = 'portfolio' and (storage.foldername(name))[1] = current_profile_id()::text
  );
create policy "owner updates own portfolio covers" on storage.objects
  for update using (
    bucket_id = 'portfolio' and (storage.foldername(name))[1] = current_profile_id()::text
  );
create policy "owner deletes own portfolio covers" on storage.objects
  for delete using (
    bucket_id = 'portfolio' and (storage.foldername(name))[1] = current_profile_id()::text
  );
