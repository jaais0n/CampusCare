-- Fix RLS policies for avatars storage and profiles table

-- 1. Storage bucket policies (run in Supabase Dashboard > Storage > Policies)
-- For the 'avatars' bucket, create these policies:

-- Policy: Allow authenticated users to upload avatars
-- Target: INSERT
-- Expression: (auth.role() = 'authenticated')

-- Policy: Allow authenticated users to update their own avatars  
-- Target: UPDATE
-- Expression: (auth.uid()::text = (storage.foldername(name))[1])

-- Policy: Allow public read access
-- Target: SELECT
-- Expression: true

-- 2. Fix profiles table RLS for upsert with user_id

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policies that work with user_id column
CREATE POLICY "profiles_insert_authenticated" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid()::text = id::text);

CREATE POLICY "profiles_update_own_by_user_id" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid()::text = id::text)
  WITH CHECK (auth.uid() = user_id OR auth.uid()::text = id::text);

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (true);

-- Also ensure avatar_url column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;
