-- ========================================================
-- SwasthyaScan Add Optional Profile Fields
-- Run this in the Supabase SQL Editor
-- ========================================================

-- Add new columns to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_group text;

-- Update the trigger function to include the new fields
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, 
    role, 
    full_name, 
    preferred_language,
    age,
    sex,
    blood_group
  )
  values (
    new.id,
    'patient',
    coalesce(new.raw_user_meta_data->>'full_name', 'Patient'),
    'en',
    (new.raw_user_meta_data->>'age')::integer,
    new.raw_user_meta_data->>'sex',
    new.raw_user_meta_data->>'blood_group'
  );
  return new;
end;
$$;
