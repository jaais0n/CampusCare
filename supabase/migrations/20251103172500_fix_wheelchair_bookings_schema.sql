-- Fix wheelchair_bookings table to match frontend expectations
-- Add missing fields and create wheelchairs table if it doesn't exist

-- First, create wheelchairs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wheelchairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wheelchair_type text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  location text NOT NULL,
  condition text CHECK (condition IN ('excellent', 'good', 'fair', 'needs_repair')) DEFAULT 'good',
  status text CHECK (status IN ('available', 'booked', 'maintenance', 'out_of_service')) DEFAULT 'available',
  last_maintenance timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on wheelchairs table
ALTER TABLE public.wheelchairs ENABLE ROW LEVEL SECURITY;

-- Add missing columns to wheelchair_bookings table
ALTER TABLE public.wheelchair_bookings 
  ADD COLUMN IF NOT EXISTS wheelchair_id uuid REFERENCES public.wheelchairs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS booking_date date,
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS end_time time,
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS special_requirements text,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Update the status check constraint to match frontend expectations
ALTER TABLE public.wheelchair_bookings 
  DROP CONSTRAINT IF EXISTS wheelchair_bookings_status_check;

ALTER TABLE public.wheelchair_bookings 
  ADD CONSTRAINT wheelchair_bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

-- Update default status to match frontend
ALTER TABLE public.wheelchair_bookings 
  ALTER COLUMN status SET DEFAULT 'pending';

-- Create updated_at trigger for wheelchairs table
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_wheelchairs ON public.wheelchairs;
CREATE TRIGGER set_updated_at_wheelchairs
  BEFORE UPDATE ON public.wheelchairs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS policies for wheelchairs table
DROP POLICY IF EXISTS "Allow authenticated users to view wheelchairs" ON public.wheelchairs;
CREATE POLICY "Allow authenticated users to view wheelchairs"
  ON public.wheelchairs FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow admin to manage wheelchairs" ON public.wheelchairs;
CREATE POLICY "Allow admin to manage wheelchairs"
  ON public.wheelchairs FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Insert some sample wheelchairs if the table is empty
INSERT INTO public.wheelchairs (wheelchair_type, brand, model, location, condition, status)
SELECT 
  'Manual',
  'Invacare',
  'Tracer EX2',
  'Main Building - Ground Floor',
  'excellent',
  'available'
WHERE NOT EXISTS (SELECT 1 FROM public.wheelchairs)
UNION ALL
SELECT 
  'Electric',
  'Pride Mobility',
  'Jazzy Elite HD',
  'Medical Center',
  'good',
  'available'
WHERE NOT EXISTS (SELECT 1 FROM public.wheelchairs)
UNION ALL
SELECT 
  'Manual',
  'Drive Medical',
  'Silver Sport 2',
  'Library Building',
  'good',
  'available'
WHERE NOT EXISTS (SELECT 1 FROM public.wheelchairs)
UNION ALL
SELECT 
  'Manual',
  'Karman Healthcare',
  'LT-980',
  'Student Center',
  'excellent',
  'available'
WHERE NOT EXISTS (SELECT 1 FROM public.wheelchairs);
