ALTER TABLE public.screenings ADD COLUMN IF NOT EXISTS follow_up_status text default 'Pending';
ALTER TABLE public.screenings ADD COLUMN IF NOT EXISTS follow_up_note text;
