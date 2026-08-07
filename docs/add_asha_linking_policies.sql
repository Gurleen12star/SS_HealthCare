-- Run this in the Supabase SQL Editor to allow ASHA workers to link patients

-- Allow ASHA workers to insert worker_patient_links (they link themselves to a patient)
create policy "workers_create_own_links" 
on public.worker_patient_links for insert 
to authenticated 
with check (worker_id = (select auth.uid()));

-- Allow ASHA workers to update worker_patient_links (e.g. to set active=false)
create policy "workers_update_own_links" 
on public.worker_patient_links for update 
to authenticated 
using (worker_id = (select auth.uid()))
with check (worker_id = (select auth.uid()));

-- Allow ASHA workers to insert consents for a patient they have just scanned
-- Note: In a production environment, consent should be cryptographically signed by the patient, 
-- but for the MVP, scanning the patient's QR code implies physical consent.
create policy "workers_create_patient_consent" 
on public.consents for insert 
to authenticated 
with check (worker_id = (select auth.uid()));

-- Allow ASHA workers to view all patients they are linked to
create policy "workers_read_assigned_patient_profiles" 
on public.profiles for select 
to authenticated 
using (
  exists (
    select 1 from public.worker_patient_links wpl
    where wpl.worker_id = (select auth.uid()) and wpl.patient_id = profiles.id and wpl.active = true
  )
);
