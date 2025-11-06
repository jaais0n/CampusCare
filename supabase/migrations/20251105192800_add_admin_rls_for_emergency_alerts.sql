-- 1. Enable RLS on the table if not already enabled
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies for SELECT to avoid conflicts
DROP POLICY IF EXISTS "Allow admins to read all alerts" ON public.emergency_alerts;
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.emergency_alerts;

-- 3. Create a policy for admins to read all alerts
-- This policy allows users with the 'admin' role in their metadata to select any row.
CREATE POLICY "Allow admins to read all alerts" 
ON public.emergency_alerts
FOR SELECT
TO authenticated
USING (
  (get_my_claim('user_metadata'::text) ->> 'role'::text) = 'admin'::text
);

-- 4. Create a policy for users to view their own alerts
-- This allows a user to select only the rows that match their own user ID.
CREATE POLICY "Users can view their own alerts"
ON public.emergency_alerts
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);
