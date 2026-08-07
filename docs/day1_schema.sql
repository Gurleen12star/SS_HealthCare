-- ========================================================
-- SwasthyaScan Day 1 Schema
-- Copy this into the Supabase SQL Editor and run it once.
-- ========================================================

create type public.user_role as enum (
  'patient',
  'asha'
);

create type public.screening_type as enum (
  'anemia',
  'jaundice',
  'skin',
  'oral',
  'heart_rate',
  'covid_symptoms'
);

create type public.risk_level as enum (
  'low',
  'moderate',
  'elevated',
  'urgent',
  'unknown'
);

create type public.followup_priority as enum (
  'routine',
  'priority',
  'urgent'
);

create type public.followup_status as enum (
  'pending',
  'completed',
  'cancelled'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  date_of_birth date,
  sex text,
  preferred_language text not null default 'en',
  village text,
  phone text,
  patient_code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.screenings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  screening_type public.screening_type not null,
  result_label text,
  risk_level public.risk_level not null default 'unknown',
  numeric_value double precision,
  unit text,
  confidence double precision check (confidence is null or (confidence >= 0 and confidence <= 1)),
  quality_score double precision check (quality_score is null or (quality_score >= 0 and quality_score <= 1)),
  model_version text,
  recommendation text,
  is_mock boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  file_path text not null,
  report_type text,
  status text not null default 'uploaded',
  extracted_data jsonb,
  created_at timestamptz not null default now()
);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  file_path text not null,
  ocr_text text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  medicine_name text not null,
  strength text,
  frequency text,
  timing text,
  instructions text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.worker_patient_links (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(worker_id, patient_id)
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,
  screenings boolean not null default false,
  reports boolean not null default false,
  prescriptions boolean not null default false,
  followups boolean not null default false,
  granted boolean not null default false,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(patient_id, worker_id)
);

create table public.followups (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  worker_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  priority public.followup_priority not null default 'routine',
  status public.followup_status not null default 'pending',
  due_date date,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index screenings_patient_idx on public.screenings(patient_id);
create index reports_patient_idx on public.reports(patient_id);
create index prescriptions_patient_idx on public.prescriptions(patient_id);
create index worker_patient_worker_idx on public.worker_patient_links(worker_id);
create index worker_patient_patient_idx on public.worker_patient_links(patient_id);
create index consent_patient_idx on public.consents(patient_id);
create index consent_worker_idx on public.consents(worker_id);
create index followups_patient_idx on public.followups(patient_id);
create index followups_worker_idx on public.followups(worker_id);

alter table public.profiles enable row level security;
alter table public.screenings enable row level security;
alter table public.reports enable row level security;
alter table public.prescriptions enable row level security;
alter table public.medications enable row level security;
alter table public.worker_patient_links enable row level security;
alter table public.consents enable row level security;
alter table public.followups enable row level security;

-- Profiles RLS
create policy "users_read_own_profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "users_create_own_profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "users_update_own_profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Screenings RLS
create policy "patients_read_own_screenings" on public.screenings for select to authenticated using (patient_id = (select auth.uid()));
create policy "patients_create_own_screenings" on public.screenings for insert to authenticated with check (patient_id = (select auth.uid()));

-- Reports RLS
create policy "patients_read_own_reports" on public.reports for select to authenticated using (patient_id = (select auth.uid()));
create policy "patients_create_own_reports" on public.reports for insert to authenticated with check (patient_id = (select auth.uid()));

-- Prescriptions RLS
create policy "patients_read_own_prescriptions" on public.prescriptions for select to authenticated using (patient_id = (select auth.uid()));
create policy "patients_create_own_prescriptions" on public.prescriptions for insert to authenticated with check (patient_id = (select auth.uid()));

-- Medications RLS
create policy "patients_read_own_medications" on public.medications for select to authenticated using (
  exists (
    select 1 from public.prescriptions p
    where p.id = medications.prescription_id and p.patient_id = (select auth.uid())
  )
);

-- Consents RLS
create policy "patients_read_own_consents" on public.consents for select to authenticated using (patient_id = (select auth.uid()));
create policy "patients_create_own_consents" on public.consents for insert to authenticated with check (patient_id = (select auth.uid()));
create policy "patients_update_own_consents" on public.consents for update to authenticated using (patient_id = (select auth.uid())) with check (patient_id = (select auth.uid()));

-- Worker-patient links RLS
create policy "users_read_own_worker_links" on public.worker_patient_links for select to authenticated using (
  worker_id = (select auth.uid()) or patient_id = (select auth.uid())
);

-- ASHA RLS policies through consent
create policy "workers_read_consented_screenings" on public.screenings for select to authenticated using (
  exists (
    select 1 from public.worker_patient_links wpl
    join public.consents c on c.patient_id = wpl.patient_id and c.worker_id = wpl.worker_id
    where wpl.worker_id = (select auth.uid()) and wpl.patient_id = screenings.patient_id and wpl.active = true and c.granted = true and c.screenings = true
  )
);

create policy "workers_read_consented_reports" on public.reports for select to authenticated using (
  exists (
    select 1 from public.worker_patient_links wpl
    join public.consents c on c.patient_id = wpl.patient_id and c.worker_id = wpl.worker_id
    where wpl.worker_id = (select auth.uid()) and wpl.patient_id = reports.patient_id and wpl.active = true and c.granted = true and c.reports = true
  )
);

create policy "workers_read_consented_prescriptions" on public.prescriptions for select to authenticated using (
  exists (
    select 1 from public.worker_patient_links wpl
    join public.consents c on c.patient_id = wpl.patient_id and c.worker_id = wpl.worker_id
    where wpl.worker_id = (select auth.uid()) and wpl.patient_id = prescriptions.patient_id and wpl.active = true and c.granted = true and c.prescriptions = true
  )
);

create policy "patients_read_own_followups" on public.followups for select to authenticated using (patient_id = (select auth.uid()));

create policy "workers_read_consented_followups" on public.followups for select to authenticated using (
  worker_id = (select auth.uid()) and exists (
    select 1 from public.consents c
    where c.patient_id = followups.patient_id and c.worker_id = (select auth.uid()) and c.granted = true and c.followups = true
  )
);

create policy "workers_read_assigned_consented_patient_profile" on public.profiles for select to authenticated using (
  exists (
    select 1 from public.worker_patient_links wpl
    join public.consents c on c.patient_id = wpl.patient_id and c.worker_id = wpl.worker_id
    where wpl.worker_id = (select auth.uid()) and wpl.patient_id = profiles.id and wpl.active = true and c.granted = true
  )
);
