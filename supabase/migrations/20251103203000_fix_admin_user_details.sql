-- Fix admin panel user details visibility
-- Ensure proper foreign key relationships and RLS policies

-- First, ensure the foreign key relationship exists between wheelchair_bookings and profiles
ALTER TABLE public.wheelchair_bookings 
  DROP CONSTRAINT IF EXISTS wheelchair_bookings_user_id_fkey;

ALTER TABLE public.wheelchair_bookings 
  ADD CONSTRAINT wheelchair_bookings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update RLS policies to ensure admin can access all profiles when joining
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_self_or_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Ensure wheelchair_bookings RLS allows admin to see all bookings with user details
DROP POLICY IF EXISTS "wheelchair_select_self_or_admin" ON public.wheelchair_bookings;
CREATE POLICY "wheelchair_select_self_or_admin"
  ON public.wheelchair_bookings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Create a view that makes it easier to query bookings with user details for admins
CREATE OR REPLACE VIEW public.admin_wheelchair_bookings AS
SELECT 
  wb.*,
  p.full_name,
  p.roll_number,
  p.course,
  p.department,
  w.wheelchair_type,
  w.brand,
  w.model,
  w.location,
  w.condition as wheelchair_condition,
  w.status as wheelchair_status
FROM public.wheelchair_bookings wb
LEFT JOIN public.profiles p ON wb.user_id = p.id
LEFT JOIN public.wheelchairs w ON wb.wheelchair_id = w.id;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.admin_wheelchair_bookings TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.admin_wheelchair_bookings SET (security_invoker = true);

-- Ensure we have some test data for debugging
-- Insert a test profile if none exists (for testing purposes)
INSERT INTO public.profiles (id, full_name, roll_number, role, course, department)
SELECT 
  gen_random_uuid(),
  'Test Student',
  'CS2021001',
  'student',
  'Computer Science',
  'Engineering'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'student')
ON CONFLICT DO NOTHING;

-- Create an admin user for testing if none exists
INSERT INTO public.profiles (id, full_name, roll_number, role, course, department)
SELECT 
  gen_random_uuid(),
  'Admin User',
  'ADMIN001',
  'admin',
  'Administration',
  'Management'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin')
ON CONFLICT DO NOTHING;
