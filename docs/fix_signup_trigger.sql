-- ========================================================
-- SwasthyaScan Profile Trigger Fix
-- Run this in the Supabase SQL Editor
-- ========================================================

-- Create a function that automatically creates a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, preferred_language)
  values (
    new.id,
    'patient',
    coalesce(new.raw_user_meta_data->>'full_name', 'Patient'),
    'en'
  );
  return new;
end;
$$;

-- Attach the trigger to the auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
