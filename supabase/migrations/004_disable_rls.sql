-- Migration: Disable RLS and grant full permissions
-- This ensures the service role can perform all operations

-- Disable RLS on all tables (INCLUDING product_images!)
ALTER TABLE IF EXISTS public.product_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_values DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_type_properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_property_values DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_variant_property_values DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_images DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to authenticated users (for service role)
GRANT ALL ON public.product_types TO authenticated;
GRANT ALL ON public.properties TO authenticated;
GRANT ALL ON public.property_values TO authenticated;
GRANT ALL ON public.product_type_properties TO authenticated;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.product_property_values TO authenticated;
GRANT ALL ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variant_property_values TO authenticated;
GRANT ALL ON public.product_images TO authenticated;

-- Grant full permissions to anon role (for public access if needed)
GRANT ALL ON public.product_types TO anon;
GRANT ALL ON public.properties TO anon;
GRANT ALL ON public.property_values TO anon;
GRANT ALL ON public.product_type_properties TO anon;
GRANT ALL ON public.products TO anon;
GRANT ALL ON public.product_property_values TO anon;
GRANT ALL ON public.product_variants TO anon;
GRANT ALL ON public.product_variant_property_values TO anon;
GRANT ALL ON public.product_images TO anon;

-- Grant full permissions to service_role (for API operations with service key)
GRANT ALL ON public.product_types TO service_role;
GRANT ALL ON public.properties TO service_role;
GRANT ALL ON public.property_values TO service_role;
GRANT ALL ON public.product_type_properties TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.product_property_values TO service_role;
GRANT ALL ON public.product_variants TO service_role;
GRANT ALL ON public.product_variant_property_values TO service_role;
GRANT ALL ON public.product_images TO service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

