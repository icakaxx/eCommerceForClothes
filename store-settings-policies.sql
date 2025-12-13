-- ============================================================================
-- STORE SETTINGS RLS POLICIES
-- ============================================================================
-- This script creates Row Level Security policies for the store_settings table
-- Store settings should be readable by everyone but writable only by admins
-- ============================================================================

-- Enable RLS on store_settings table
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Anyone can read store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Service role can manage store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can read store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can manage store settings" ON public.store_settings;

-- ============================================================================
-- READ POLICIES (Public Access)
-- ============================================================================

-- Policy: Anyone can read store settings
-- This allows public access to store configuration (store name, logo, theme, language)
CREATE POLICY "Anyone can read store settings"
ON public.store_settings
FOR SELECT
TO public
USING (true);

-- ============================================================================
-- WRITE POLICIES (Admin/Service Role Only)
-- ============================================================================

-- Policy: Service role can manage store settings
-- This allows full CRUD operations only through the service role key
-- Used by admin dashboard and server-side operations
CREATE POLICY "Service role can manage store settings"
ON public.store_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'store_settings';

-- List all policies for store_settings
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'store_settings'
ORDER BY policyname;

-- Test query (should work for anyone)
-- SELECT * FROM store_settings LIMIT 1;

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
-- 1. Public read access allows clients to display store branding and configuration
-- 2. Write access is restricted to service role only (server-side admin operations)
-- 3. No user-based policies needed since this is global store configuration
-- 4. The single row design assumes one store configuration record
