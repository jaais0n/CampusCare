-- Update wheelchair_bookings table to match simplified booking form

ALTER TABLE public.wheelchair_bookings
  ALTER COLUMN start_time DROP NOT NULL,
  ALTER COLUMN end_time DROP NOT NULL,
  ALTER COLUMN pickup_location DROP NOT NULL,
  ALTER COLUMN return_location DROP NOT NULL;
