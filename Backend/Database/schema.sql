-- =====================================================================
-- PAWFECT DATABASE (PostgreSQL / Supabase)
-- Built from the finished front end. Paste all of this into
-- Supabase > SQL Editor > New query, then click Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. CLEAN START
-- Removes any tables from the earlier draft so this script can be re-run.
-- WARNING: this deletes all data in these tables. Fine while the project
-- is empty; remove this block once real data exists.
-- ---------------------------------------------------------------------
drop table if exists care_task_logs, vaccinations, weight_records, health_records,
                     diary_entries, reminders, care_tasks, appointments, vets,
                     pets, articles, otp_codes, profiles cascade;

-- ---------------------------------------------------------------------
-- 1. PROFILES  (users and admins; PHP stores the hashed password here)
-- ---------------------------------------------------------------------
create table profiles (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  email           text not null unique,           -- PHP saves it in lowercase
  password_hash   text not null,                  -- from PHP password_hash(), never the real password
  phone           text,
  city            text,
  avatar_url      text,
  role            text not null default 'owner' check (role in ('owner', 'admin')),
  status          text not null default 'active' check (status in ('active', 'blocked')),
  email_verified  boolean not null default false, -- becomes true after the OTP step
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. OTP CODES  (register + forgot-password, each code lives 1 minute)
-- ---------------------------------------------------------------------
create table otp_codes (
  id          bigint generated always as identity primary key,
  email       text not null,
  purpose     text not null check (purpose in ('register', 'reset')),
  code_hash   text not null,                      -- the 6-digit code is stored hashed
  expires_at  timestamptz not null,
  attempts    integer not null default 0,
  verified_at timestamptz,                        -- set when the code was entered correctly
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. PETS
-- ---------------------------------------------------------------------
create table pets (
  id             bigint generated always as identity primary key,
  owner_id       uuid not null references profiles(id) on delete cascade,
  name           text not null,
  species        text not null check (species in ('Dog', 'Cat', 'Rabbit', 'Bird', 'Other')),
  breed          text,
  gender         text,
  date_of_birth  date,                            -- age is calculated from this
  weight_kg      numeric(6,2),                    -- current weight
  colour         text,
  microchip_no   text,
  description    text,
  photo_url      text,
  health_status  text not null default 'Healthy',
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. VETS  (maintained by the admin; fills the Veterinarian dropdown)
-- ---------------------------------------------------------------------
create table vets (
  id         bigint generated always as identity primary key,
  full_name  text not null,
  phone      text,
  is_active  boolean not null default true
);

-- ---------------------------------------------------------------------
-- 5. APPOINTMENTS
-- ---------------------------------------------------------------------
create table appointments (
  id                bigint generated always as identity primary key,
  pet_id            bigint not null references pets(id) on delete cascade,
  vet_id            bigint references vets(id) on delete set null,
  appointment_date  date not null,
  appointment_time  time not null,
  reason            text,
  status            text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. HEALTH RECORDS  (vaccinations, checkups, medication: one history)
--    Vaccination page: title = vaccine name, record_date = given date,
--    next_due = due date. Status (Overdue / Due soon / Up to date) is
--    worked out from next_due, never stored.
-- ---------------------------------------------------------------------
create table health_records (
  id           bigint generated always as identity primary key,
  pet_id       bigint not null references pets(id) on delete cascade,
  type         text not null check (type in ('vaccination', 'checkup', 'medication', 'other')),
  title        text not null,
  record_date  date not null,
  next_due     date,
  notes        text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7. WEIGHT RECORDS  (feeds the weight chart)
-- ---------------------------------------------------------------------
create table weight_records (
  id           bigint generated always as identity primary key,
  pet_id       bigint not null references pets(id) on delete cascade,
  recorded_on  date not null,
  weight_kg    numeric(6,2) not null
);

-- ---------------------------------------------------------------------
-- 8. DAILY CARE TASKS
--    pet_id empty = a task for all pets. A task counts as done today only
--    if last_done_date is today, so it resets itself every day.
-- ---------------------------------------------------------------------
create table care_tasks (
  id              bigint generated always as identity primary key,
  owner_id        uuid not null references profiles(id) on delete cascade,
  pet_id          bigint references pets(id) on delete cascade,
  name            text not null,
  category        text not null check (category in ('feeding', 'activity', 'health')),
  task_time       time,
  last_done_date  date,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 9. REMINDERS
--    pet_id empty = "all pets"; remind_time is optional.
-- ---------------------------------------------------------------------
create table reminders (
  id           bigint generated always as identity primary key,
  owner_id     uuid not null references profiles(id) on delete cascade,
  pet_id       bigint references pets(id) on delete cascade,
  type         text not null default 'other' check (type in ('vaccination', 'medicine', 'grooming', 'vet', 'other')),
  name         text not null,
  details      text,
  remind_date  date not null,
  remind_time  time,
  is_done      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 10. DIARY
-- ---------------------------------------------------------------------
create table diary_entries (
  id          bigint generated always as identity primary key,
  pet_id      bigint not null references pets(id) on delete cascade,
  title       text not null,
  content     text,
  mood        text check (mood in ('happy', 'excited', 'relaxed', 'playful', 'tired', 'unwell', 'calm')),
  entry_date  date not null default current_date,
  photo_url   text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 11. ARTICLES  (written by the admin, read by everyone)
-- ---------------------------------------------------------------------
create table articles (
  id            bigint generated always as identity primary key,
  author_id     uuid references profiles(id) on delete set null,
  title         text not null,
  category      text not null default 'All' check (category in ('All', 'Dogs', 'Cats', 'Rabbits', 'Birds')),
  summary       text,
  content       text,
  image_url     text,
  status        text not null default 'draft' check (status in ('draft', 'published')),
  published_on  date,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 12. INDEXES  (faster lookups on the columns the pages filter by)
-- ---------------------------------------------------------------------
create index idx_pets_owner          on pets(owner_id);
create index idx_appointments_pet    on appointments(pet_id);
create index idx_health_pet          on health_records(pet_id);
create index idx_weight_pet          on weight_records(pet_id);
create index idx_care_owner          on care_tasks(owner_id);
create index idx_reminders_owner     on reminders(owner_id);
create index idx_diary_pet           on diary_entries(pet_id);
create index idx_otp_email           on otp_codes(email, purpose);

-- ---------------------------------------------------------------------
-- 13. STARTER DATA  (the two vets your front end already lists)
-- ---------------------------------------------------------------------
insert into vets (full_name) values ('Dr. Ahmed'), ('Dr. Sara');

-- ---------------------------------------------------------------------
-- 14. LOCK THE TABLES
-- The publishable key is public, so row level security blocks it from
-- reading anything. Your PHP backend connects with the database
-- connection string instead, which is not affected by this lock.
-- ---------------------------------------------------------------------
alter table profiles       enable row level security;
alter table otp_codes      enable row level security;
alter table pets           enable row level security;
alter table vets           enable row level security;
alter table appointments   enable row level security;
alter table health_records enable row level security;
alter table weight_records enable row level security;
alter table care_tasks     enable row level security;
alter table reminders      enable row level security;
alter table diary_entries  enable row level security;
alter table articles       enable row level security;
