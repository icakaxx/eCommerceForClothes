-- ============================================================================
-- Supabase Storage Policies for 'products' bucket
-- ============================================================================
-- This script creates Storage policies to allow file uploads and access
-- Run this in Supabase SQL Editor after creating the 'products' bucket
-- ============================================================================

-- First, make sure the bucket exists and is public (if you want public access)
-- You can create it manually in Supabase Dashboard > Storage > New bucket
-- Or use this SQL (uncomment if needed):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('products', 'products', true)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Storage Policies for 'products' bucket
-- ============================================================================

-- Policy 1: Allow authenticated users (admins) to upload files
CREATE POLICY "Admins can upload to products bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
);

-- Policy 2: Allow authenticated users (admins) to update files
CREATE POLICY "Admins can update files in products bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
);

-- Policy 3: Allow authenticated users (admins) to delete files
CREATE POLICY "Admins can delete files in products bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
);

-- Policy 4: Allow public read access (if bucket is public)
-- This allows anyone to view/download images
CREATE POLICY "Public can read products bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'products');

-- Policy 5: Allow authenticated users to list files
CREATE POLICY "Admins can list files in products bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
);

-- ============================================================================
-- Alternative: More permissive policies (for development/testing)
-- ============================================================================
-- If you want to allow uploads without authentication (NOT RECOMMENDED for production):
-- 
-- CREATE POLICY "Anyone can upload to products bucket"
-- ON storage.objects
-- FOR INSERT
-- TO public
-- WITH CHECK (bucket_id = 'products');
--
-- CREATE POLICY "Anyone can read products bucket"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'products');
--
-- CREATE POLICY "Anyone can delete from products bucket"
-- ON storage.objects
-- FOR DELETE
-- TO public
-- USING (bucket_id = 'products');

-- ============================================================================
-- Notes:
-- ============================================================================
-- 1. Make sure RLS is enabled on storage.objects:
--    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
--
-- 2. If you're using anon key (client-side), you need public policies
--    If you're using service role key (server-side), authenticated policies work
--
-- 3. For client-side uploads with anon key, use the "public" policies
--    For server-side uploads with service role key, authenticated policies work
--
-- 4. Check your bucket settings:
--    - Go to Storage > products bucket > Settings
--    - Make sure "Public bucket" is enabled if you want public access
-- ============================================================================

