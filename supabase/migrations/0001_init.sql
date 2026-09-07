-- ============================================================================
-- Clinic Patient Records — initial schema (idempotent; safe to run twice)
-- The app is its own backend: direct PostgreSQL + next-auth.
-- ============================================================================

create extension if not exists pg_trgm;

-- ----------------------------------------------------------------------------
-- users (staff accounts; passwords hashed with bcrypt)
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- profiles (display info for staff users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  full_name text,
  role_label text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- patients
-- ----------------------------------------------------------------------------
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  national_id varchar(10) unique,
  mobile varchar(15) not null,
  birth_date date,
  address text,
  notes text,
  avatar_path text,
  full_name text generated always as (first_name || ' ' || last_name) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists patients_mobile_idx on public.patients (mobile);
create index if not exists patients_name_idx on public.patients (last_name, first_name);
create index if not exists patients_fullname_trgm_idx on public.patients using gin (full_name gin_trgm_ops);
create index if not exists patients_mobile_trgm_idx on public.patients using gin (mobile gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- examinations (separate entity — never embedded in the patient row)
-- ----------------------------------------------------------------------------
create table if not exists public.examinations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  exam_date timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists examinations_patient_date_idx
  on public.examinations (patient_id, exam_date desc);

-- ----------------------------------------------------------------------------
-- documents (metadata only — binaries live on the local filesystem)
-- ----------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text,
  description text,
  storage_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists documents_patient_idx
  on public.documents (patient_id, created_at desc);

-- ----------------------------------------------------------------------------
-- settings (clinic name + configurable exam-form sections)
-- ----------------------------------------------------------------------------
create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value) values
  ('clinic', '{"name": "کلینیک چشم‌پزشکی"}'::jsonb),
  (
    'exam_form',
    '{"customSections": [{
        "id": "extra",
        "label": "جدول تکمیلی (قابل تنظیم)",
        "rows": ["ردیف ۱", "ردیف ۲", "ردیف ۳"],
        "columns": ["ستون ۱", "ستون ۲", "ستون ۳", "ستون ۴"]
      }]}'::jsonb
  )
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists patients_set_updated_at on public.patients;
create trigger patients_set_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

drop trigger if exists examinations_set_updated_at on public.examinations;
create trigger examinations_set_updated_at
  before update on public.examinations
  for each row execute function public.set_updated_at();
