-- ============================================================================
-- SECURITY MIGRATION: Row Level Security (RLS) and Policies
-- ============================================================================
-- This script secures the eCommerce database with proper RLS policies
-- Run this in Supabase SQL Editor AFTER backing up your data
-- ============================================================================

-- Enable RLS on all tables in the public schema
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_property_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_property_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE (assuming auth.users exists)
-- ============================================================================
-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STORE SETTINGS POLICIES
-- ============================================================================
-- Store settings should be readable by everyone (public data)
CREATE POLICY "Anyone can read store settings"
ON public.store_settings
FOR SELECT
TO public
USING (true);

-- Store settings should only be writable by admins (service role)
CREATE POLICY "Service role can manage store settings"
ON public.store_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PRODUCT TYPES POLICIES
-- ============================================================================
-- Product types should be readable by everyone (public data)
CREATE POLICY "Anyone can read product types"
ON public.product_types
FOR SELECT
TO public
USING (true);

-- Product types should only be writable by admins (service role)
CREATE POLICY "Service role can manage product types"
ON public.product_types
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PROPERTIES POLICIES
-- ============================================================================
-- Properties should be readable by everyone (public data)
CREATE POLICY "Anyone can read properties"
ON public.properties
FOR SELECT
TO public
USING (true);

-- Properties should only be writable by admins (service role)
CREATE POLICY "Service role can manage properties"
ON public.properties
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PROPERTY VALUES POLICIES
-- ============================================================================
-- Property values should be readable by everyone (public data)
CREATE POLICY "Anyone can read property values"
ON public.property_values
FOR SELECT
TO public
USING (true);

-- Property values should only be writable by admins (service role)
CREATE POLICY "Service role can manage property values"
ON public.property_values
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================
-- Products should be readable by everyone (public data)
CREATE POLICY "Anyone can read products"
ON public.products
FOR SELECT
TO public
USING (true);

-- Products should only be writable by admins (service role)
CREATE POLICY "Service role can manage products"
ON public.products
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PRODUCT VARIANTS POLICIES
-- ============================================================================
-- Product variants should be readable by everyone (public data)
CREATE POLICY "Anyone can read product variants"
ON public.product_variants
FOR SELECT
TO public
USING (true);

-- Product variants should only be writable by admins (service role)
CREATE POLICY "Service role can manage product variants"
ON public.product_variants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PRODUCT IMAGES POLICIES
-- ============================================================================
-- Product images should be readable by everyone (public data)
CREATE POLICY "Anyone can read product images"
ON public.product_images
FOR SELECT
TO public
USING (true);

-- Product images should only be writable by admins (service role)
CREATE POLICY "Service role can manage product images"
ON public.product_images
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PRODUCT PROPERTY VALUES POLICIES
-- ============================================================================
-- Product property values should be readable by everyone (public data)
CREATE POLICY "Anyone can read product property values"
ON public.product_property_values
FOR SELECT
TO public
USING (true);

-- Product property values should only be writable by admins (service role)
CREATE POLICY "Service role can manage product property values"
ON public.product_property_values
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PRODUCT VARIANT PROPERTY VALUES POLICIES
-- ============================================================================
-- Product variant property values should be readable by everyone (public data)
CREATE POLICY "Anyone can read product variant property values"
ON public.product_variant_property_values
FOR SELECT
TO public
USING (true);

-- Product variant property values should only be writable by admins (service role)
CREATE POLICY "Service role can manage product variant property values"
ON public.product_variant_property_values
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ORDERS POLICIES (HIGHLY SENSITIVE)
-- ============================================================================
-- Orders should only be accessible by the order owner or admins
-- Note: This assumes orders have a user_id field linking to auth.users
-- If not, you'll need to add this field and migrate existing data

-- For now, orders are only accessible via service role (server-side only)
CREATE POLICY "Service role can manage orders"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Future enhancement: Add user-specific policies when user_id is added
-- CREATE POLICY "Users can view their own orders"
-- ON public.orders
-- FOR SELECT
-- TO authenticated
-- USING (auth.uid() = user_id);

-- ============================================================================
-- ORDER ITEMS POLICIES (HIGHLY SENSITIVE)
-- ============================================================================
-- Order items should only be accessible by the order owner or admins
-- For now, order items are only accessible via service role (server-side only)
CREATE POLICY "Service role can manage order items"
ON public.order_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STORAGE POLICIES (Update existing policies)
-- ============================================================================
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Admins can upload to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update files in products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete files in products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete from products bucket" ON storage.objects;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage policies - only service role can manage files
CREATE POLICY "Service role can manage product images"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'products')
WITH CHECK (bucket_id = 'products');

-- Public can still read product images (for display)
CREATE POLICY "Anyone can read product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'products');

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================
-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify RLS is working correctly:

-- 1. Check RLS status on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- MANUAL VERIFICATION STEPS
-- ============================================================================
-- After running this migration:
-- 1. Test that public product data is still accessible
-- 2. Test that admin operations work through API routes (service role)
-- 3. Test that client-side attempts to write data are blocked
-- 4. Verify storage policies allow public reads but only service role writes
-- 5. Test user registration creates profiles automatically
-- 6. Verify admin authentication works with role checking
