-- ========================================================
-- SwasthyaScan Mock Data Setup
-- Read instructions in docs before running.
-- REPLACE 'ACTUAL-ASHA-AUTH-UUID' and 'PATIENT-UUID' with real Supabase Auth UUIDs!
-- ========================================================

/*
-- Uncomment and replace UUIDs before running
insert into public.profiles (
  id,
  role,
  full_name,
  preferred_language,
  village
)
values (
  'ACTUAL-ASHA-AUTH-UUID',
  'asha',
  'Demo ASHA Worker',
  'hi',
  'Demo Village'
);

update public.profiles
set patient_code = 'SS-A1001'
where id = 'PATIENT-UUID';

insert into public.worker_patient_links (
  worker_id,
  patient_id
)
values (
  'ACTUAL-ASHA-AUTH-UUID',
  'PATIENT-UUID'
);

insert into public.consents (
  patient_id,
  worker_id,
  screenings,
  reports,
  prescriptions,
  followups,
  granted,
  granted_at
)
values (
  'PATIENT-UUID',
  'ACTUAL-ASHA-AUTH-UUID',
  true,
  true,
  false,
  true,
  true,
  now()
);
*/
