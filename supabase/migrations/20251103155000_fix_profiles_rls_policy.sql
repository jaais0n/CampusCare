-- Fix infinite recursion in profiles RLS policy

-- Drop the faulty policy
DROP POLICY "Allow users to view their own profile" ON public.profiles;

-- Recreate the policy correctly
CREATE POLICY "Allow users to view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);
