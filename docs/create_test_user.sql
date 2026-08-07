-- ========================================================
-- SwasthyaScan Instant User Creation (Bypass Rate Limits)
-- Run this in the Supabase SQL Editor
-- ========================================================

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- 1. Delete the test email if it already exists to avoid conflicts
  delete from auth.users where email = 'test@swasthyascan.com';

  -- 2. Insert into auth.users bypassing the API and Rate Limits
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'test@swasthyascan.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test Patient","age":30,"sex":"Female","blood_group":"O+"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
END $$;
