-- ============================================================================
-- Clinic Patient Records — initial schema (idempotent; safe to run twice)
-- Run this whole file in: Supabase Dashboard → SQL Editor → New query
-- ============================================================================

create extension if not exists pg_trgm;

-- ----------------------------------------------------------------------------
-- profiles (display info for the two staff users; auto-created on signup)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role_label text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role_label)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role_label', 'کاربر')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- patients
-- ----------------------------------------------------------------------------
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  national_id varchar(10) not null unique,
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
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists examinations_patient_date_idx
  on public.examinations (patient_id, exam_date desc);

-- ----------------------------------------------------------------------------
-- documents (metadata only — binaries live in Storage)
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
  uploaded_by uuid references auth.users(id) on delete set null,
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

-- ----------------------------------------------------------------------------
-- Row Level Security: both staff users (authenticated) have full access.
-- No roles/permissions system for MVP.
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.examinations enable row level security;
alter table public.documents enable row level security;
alter table public.settings enable row level security;

drop policy if exists staff_all_profiles on public.profiles;
create policy staff_all_profiles on public.profiles
  for all to authenticated using (true) with check (true);

drop policy if exists staff_all_patients on public.patients;
create policy staff_all_patients on public.patients
  for all to authenticated using (true) with check (true);

drop policy if exists staff_all_examinations on public.examinations;
create policy staff_all_examinations on public.examinations
  for all to authenticated using (true) with check (true);

drop policy if exists staff_all_documents on public.documents;
create policy staff_all_documents on public.documents
  for all to authenticated using (true) with check (true);

drop policy if exists staff_all_settings on public.settings;
create policy staff_all_settings on public.settings
  for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- Storage: private bucket for patient files + staff policies
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-documents',
  'patient-documents',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists staff_read_patient_documents on storage.objects;
create policy staff_read_patient_documents on storage.objects
  for select to authenticated
  using (bucket_id = 'patient-documents');

drop policy if exists staff_insert_patient_documents on storage.objects;
create policy staff_insert_patient_documents on storage.objects
  for insert to authenticated
  with check (bucket_id = 'patient-documents');

drop policy if exists staff_update_patient_documents on storage.objects;
create policy staff_update_patient_documents on storage.objects
  for update to authenticated
  using (bucket_id = 'patient-documents')
  with check (bucket_id = 'patient-documents');

drop policy if exists staff_delete_patient_documents on storage.objects;
create policy staff_delete_patient_documents on storage.objects
  for delete to authenticated
  using (bucket_id = 'patient-documents');
