-- Run this in the Supabase SQL Editor to create the Emergency Alerts table

create table if not exists public.emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) not null,
  status text not null default 'active', -- 'active' or 'resolved'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.emergency_alerts enable row level security;

-- Allow anyone to insert an alert (for hackathon demo simplicity)
create policy "anyone_insert_alert" 
on public.emergency_alerts for insert 
to authenticated 
with check (true);

-- Allow anyone to read alerts (ASHA workers need to poll this)
create policy "anyone_read_alert" 
on public.emergency_alerts for select 
to authenticated 
using (true);

-- Allow anyone to update alerts (e.g. to mark as resolved)
create policy "anyone_update_alert" 
on public.emergency_alerts for update 
to authenticated 
using (true)
with check (true);
