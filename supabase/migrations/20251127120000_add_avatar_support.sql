-- Create avatars storage bucket for profile photos
-- Run this in Supabase SQL Editor if storage bucket doesn't exist

-- Note: Storage buckets are created through Supabase Dashboard or API
-- This migration documents the required bucket configuration

-- Bucket name: avatars
-- Public: true (for public avatar URLs)

-- RLS Policies needed:
-- 1. Allow authenticated users to upload their own avatars
-- 2. Allow public read access to all avatars

-- If the bucket doesn't exist, create it in Supabase Dashboard:
-- Storage > New Bucket > Name: "avatars" > Public bucket: Yes

-- Add avatar_url column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;
