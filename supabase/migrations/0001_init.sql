-- Schema from docs/PRD.md §12.1–12.3 (enums, tables, helper functions, new-user trigger).
-- RLS policies live in later migrations, one per area.

create extension if not exists citext;
create extension if not exists pgcrypto;

create type goal_t            as enum ('win','learn');
create type work_time_t       as enum ('morning','afternoon','night','flexible');
create type comp_category_t   as enum ('hackathon','it_competition','ui_ux','data','business_case','paper');
create type comp_result_t     as enum ('participant','finalist','winner_1','winner_2','winner_3','honorable');
create type role_source_t     as enum ('guidebook','criteria','template','manual');
create type team_status_t     as enum ('forming','complete','archived');
create type invite_dir_t      as enum ('invite','apply');
create type invite_status_t   as enum ('pending','accepted','declined','cancelled','expired');
create type extraction_status_t as enum ('processing','draft','reviewed','failed');
create type question_type_t   as enum ('mcq','case');
create type access_source_t   as enum ('free_preview','promo','simulated_payment','admin');
create type booking_status_t  as enum ('pending_payment','paid','done','cancelled');
create type agent_t           as enum ('guidebook','recruiter','case_feedback');
create type approval_t        as enum ('pending','approved','rejected','auto');
create type app_role_t        as enum ('user','admin');
create type feedback_t        as enum ('fit','not_fit');

-- PROFIL --------------------------------------------------------------------
create table profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique references auth.users(id) on delete cascade, -- null untuk profil simulasi
  username        citext unique check (username ~ '^[a-z0-9_]{3,20}$'),
  full_name       text not null default '',
  avatar_url      text,
  campus          text,
  major           text,
  entry_year      smallint check (entry_year between 2015 and 2035),
  bio             text check (char_length(bio) <= 280),
  preferred_roles text[] not null default '{}'
                  check (cardinality(preferred_roles) <= 3
                         and preferred_roles <@ array['backend','frontend','uiux','data','product','business']),
  hours_per_week  smallint not null default 0 check (hours_per_week between 0 and 40),
  goal            goal_t not null default 'learn',
  work_time       work_time_t not null default 'flexible',
  open_to_invite  boolean not null default true,
  onboarding_done boolean not null default false,
  app_role        app_role_t not null default 'user',
  is_simulated    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table profile_contacts (           -- privat, dibaca lewat RLS khusus
  profile_id    uuid primary key references profiles(id) on delete cascade,
  whatsapp      text check (whatsapp ~ '^\+62[0-9]{8,13}$'),
  contact_email text
);

create table skills (
  id       serial primary key,
  slug     text unique not null,
  name     text not null,
  category text not null check (category in ('engineering','design','data_ai','product_business','communication')),
  aliases  text[] not null default '{}'
);

create table profile_skills (
  profile_id   uuid references profiles(id) on delete cascade,
  skill_id     int  references skills(id),
  level        smallint not null check (level between 1 and 4),
  evidence_url text,
  primary key (profile_id, skill_id)
);

create table competition_history (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references profiles(id) on delete cascade,
  competition_name text not null,
  year             smallint not null check (year between 2015 and 2035),
  category         comp_category_t not null,
  role             text,
  result           comp_result_t not null default 'participant',
  evidence_url     text,
  note             text check (char_length(note) <= 200),
  created_at       timestamptz not null default now()
);

create table portfolio_items (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  title       text not null check (char_length(title) <= 80),
  description text check (char_length(description) <= 300),
  url         text not null,
  cover_path  text,
  skill_ids   int[] not null default '{}',
  sort        smallint not null default 0,
  created_at  timestamptz not null default now()
);

-- LOMBA ---------------------------------------------------------------------
create table competitions (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  name                  text not null,
  organizer             text not null,
  category              comp_category_t not null,
  description           text,
  registration_deadline date,
  event_date            date,
  team_min              smallint not null default 1,
  team_max              smallint not null default 4,
  official_url          text,
  poster_path           text,
  guidebook_path        text,
  eligibility           jsonb not null default '{}',   -- contoh {"degree":["S1","D3"]}
  is_featured           boolean not null default false,
  is_published          boolean not null default true,
  is_simulated          boolean not null default false,
  created_by            uuid references profiles(id),
  created_at            timestamptz not null default now(),
  check (team_min <= team_max)
);

create table competition_extractions (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  status         extraction_status_t not null default 'processing',
  data           jsonb,              -- GuidebookExtraction + hasil pemetaan skill
  model          text,
  prompt_version text,
  page_count     int,
  warnings       text[] not null default '{}',
  error          text,
  created_by     uuid references profiles(id),
  reviewed_by    uuid references profiles(id),
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);

create table competition_interests (
  profile_id     uuid references profiles(id) on delete cascade,
  competition_id uuid references competitions(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (profile_id, competition_id)
);

create table role_templates (
  id                 serial primary key,
  category           comp_category_t not null,
  name               text not null,
  description        text,
  color_key          text not null default 'other',
  required_skills    jsonb not null,           -- [{"skill_id":1,"min_level":2}]
  optional_skill_ids int[] not null default '{}',
  hours_per_week     smallint not null,
  slots              smallint not null default 1,
  sort               smallint not null default 0
);

-- TIM -----------------------------------------------------------------------
create table teams (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  leader_id      uuid not null references profiles(id) on delete cascade,
  name           text not null check (char_length(name) between 2 and 40),
  goal           goal_t not null,
  work_time      work_time_t not null,
  status         team_status_t not null default 'forming',
  extraction_id  uuid references competition_extractions(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (competition_id, leader_id)
);

create table team_roles (
  id                 uuid primary key default gen_random_uuid(),
  team_id            uuid not null references teams(id) on delete cascade,
  name               text not null check (char_length(name) between 2 and 40),
  description        text check (char_length(description) <= 200),
  color_key          text not null default 'other',
  source             role_source_t not null,
  source_page        smallint,
  source_criterion   text,
  edited             boolean not null default false,
  required_skills    jsonb not null,           -- [{"skill_id":1,"min_level":2}]
  optional_skill_ids int[] not null default '{}',
  hours_per_week     smallint not null check (hours_per_week between 1 and 40),
  slots              smallint not null default 1 check (slots between 1 and 3),
  sort               smallint not null default 0,
  created_at         timestamptz not null default now()
);

create table team_members (
  team_id        uuid references teams(id) on delete cascade,
  profile_id     uuid references profiles(id) on delete cascade,
  competition_id uuid not null references competitions(id) on delete cascade,
  team_role_id   uuid references team_roles(id) on delete set null,
  is_leader      boolean not null default false,
  joined_at      timestamptz not null default now(),
  primary key (team_id, profile_id),
  unique (competition_id, profile_id)        -- satu orang satu tim per lomba
);

create table invites (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references teams(id) on delete cascade,
  team_role_id    uuid not null references team_roles(id) on delete cascade,
  candidate_id    uuid not null references profiles(id) on delete cascade, -- orang yang akan bergabung
  created_by      uuid not null references profiles(id),
  direction       invite_dir_t not null,        -- invite: ketua ke kandidat, apply: kandidat ke ketua
  message         text check (char_length(message) <= 500),
  status          invite_status_t not null default 'pending',
  ai_drafted      boolean not null default false,
  agent_action_id uuid,
  created_at      timestamptz not null default now(),
  responded_at    timestamptz
);
create unique index invites_one_pending on invites(team_id, candidate_id) where status = 'pending';
create index invites_candidate on invites(candidate_id, status);

create table recommendation_feedback (
  team_role_id uuid references team_roles(id) on delete cascade,
  candidate_id uuid references profiles(id) on delete cascade,
  score        smallint not null,
  factors      jsonb not null,
  feedback     feedback_t not null,
  created_by   uuid not null references profiles(id),
  created_at   timestamptz not null default now(),
  primary key (team_role_id, candidate_id)
);

create table matching_config (
  id                 serial primary key,
  weights            jsonb not null default '{"coverage":0.4,"level":0.2,"availability":0.2,"experience":0.1,"fit":0.1}',
  no_evidence_factor numeric not null default 0.85,
  optional_bonus     numeric not null default 0.1,
  experience_cap     smallint not null default 3,
  podium_bonus       numeric not null default 0.2,
  active             boolean not null default true,
  created_at         timestamptz not null default now()
);
create unique index matching_config_one_active on matching_config(active) where active;

create table agent_actions (
  id          uuid primary key default gen_random_uuid(),
  agent       agent_t not null,
  actor_id    uuid not null references profiles(id) on delete cascade,
  team_id     uuid references teams(id) on delete cascade,
  target_id   uuid,
  input       jsonb,
  output      jsonb,
  approval    approval_t not null default 'pending',
  model       text,
  duration_ms int,
  error       text,
  created_at  timestamptz not null default now()
);

-- BELAJAR -------------------------------------------------------------------
create table courses (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  subtitle     text,
  description  text,
  cover_path   text,
  category     comp_category_t not null,
  level        text not null default 'Pemula',
  est_minutes  int,
  price        int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create table chapters (
  id        uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title     text not null,
  sort      smallint not null
);

create table lessons (
  id              uuid primary key default gen_random_uuid(),
  chapter_id      uuid not null references chapters(id) on delete cascade,
  slug            text not null,
  title           text not null,
  content_md      text not null,
  video_url       text,
  est_minutes     int,
  is_free_preview boolean not null default false,
  sort            smallint not null,
  unique (chapter_id, slug)
);

create table questions (
  id             uuid primary key default gen_random_uuid(),
  lesson_id      uuid not null references lessons(id) on delete cascade,
  type           question_type_t not null,
  prompt_md      text not null,
  options        jsonb,     -- mcq: [{"key":"A","text":"..."}]
  answer_key     text,      -- mcq: "A". TIDAK BOLEH terbaca klien
  explanation_md text,
  rubric         jsonb,     -- case: [{"criterion":"...","description":"...","max_score":5}]
  points         smallint not null default 5,
  sort           smallint not null
);

create view questions_public as
  select id, lesson_id, type, prompt_md, options, rubric, points, sort from questions;

create table attempts (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references profiles(id) on delete cascade,
  question_id    uuid not null references questions(id) on delete cascade,
  answer         jsonb not null,  -- mcq: {"choice":"A"}, case: {"text":"..."}
  is_correct     boolean,
  score          numeric,
  points_awarded smallint not null default 0,
  ai_feedback    jsonb,
  attempt_no     smallint not null default 1,
  created_at     timestamptz not null default now()
);
create index attempts_profile_question on attempts(profile_id, question_id);

create table lesson_progress (
  profile_id   uuid references profiles(id) on delete cascade,
  lesson_id    uuid references lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (profile_id, lesson_id)
);

create table course_access (
  profile_id uuid references profiles(id) on delete cascade,
  course_id  uuid references courses(id) on delete cascade,
  source     access_source_t not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, course_id)
);

create table promo_codes (
  code             text primary key,
  course_id        uuid references courses(id) on delete cascade, -- null = semua kursus
  discount_percent smallint not null check (discount_percent between 1 and 100),
  quota            int not null,
  used             int not null default 0,
  expires_at       timestamptz
);

-- MENTOR --------------------------------------------------------------------
create table mentors (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid references profiles(id) on delete set null,
  display_name          text not null,
  photo_path            text,
  roles                 text[] not null,          -- kunci warna role: backend, frontend, uiux, data, product, business
  headline              text not null,            -- satu baris kredensial
  bio                   text,
  achievements          jsonb not null default '[]', -- [{"year":2024,"title":"Juara 1 ..."}]
  competition_categories comp_category_t[] not null default '{}',
  verified              boolean not null default false,
  is_simulated          boolean not null default false,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);

create table mentor_contacts (
  mentor_id     uuid primary key references mentors(id) on delete cascade,
  whatsapp      text,
  contact_email text
);

create table mentor_services (
  id           uuid primary key default gen_random_uuid(),
  mentor_id    uuid not null references mentors(id) on delete cascade,
  name         text not null,
  description  text,
  duration_min smallint not null,
  price        int not null check (price >= 0)
);

create table mentor_slots (
  id        uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references mentors(id) on delete cascade,
  starts_at timestamptz not null,
  is_booked boolean not null default false
);

create table bookings (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references teams(id) on delete cascade,
  booked_by    uuid not null references profiles(id),
  mentor_id    uuid not null references mentors(id),
  service_id   uuid not null references mentor_services(id),
  slot_id      uuid unique references mentor_slots(id),
  price        int not null,
  platform_fee int not null,
  mentor_share int not null,
  status       booking_status_t not null default 'pending_payment',
  is_simulated boolean not null default true,
  created_at   timestamptz not null default now(),
  paid_at      timestamptz,
  check (platform_fee + mentor_share = price)
);

-- NOTIFIKASI ------------------------------------------------------------------
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type       text not null,   -- invite_received, invite_accepted, invite_declined, booking_paid
  payload    jsonb not null default '{}',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_unread on notifications(profile_id) where read_at is null;

create or replace function current_profile_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from profiles where user_id = auth.uid()
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where user_id = auth.uid() and app_role = 'admin')
$$;

create or replace function is_team_member(p_team uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from team_members where team_id = p_team and profile_id = current_profile_id())
$$;

create or replace function are_teammates(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from team_members m1 join team_members m2 on m1.team_id = m2.team_id
    where m1.profile_id = a and m2.profile_id = b
  )
$$;

-- Profil baru otomatis saat user mendaftar
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (user_id, full_name, avatar_url)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', ''),
          new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
