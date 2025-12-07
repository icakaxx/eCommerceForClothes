-- Grant permissions to service_role and authenticated roles
-- This ensures the service role key has full access to all tables

-- Grant usage on schema first
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO postgres;

-- Grant permissions on product_types
GRANT ALL ON public.product_types TO service_role;
GRANT ALL ON public.product_types TO authenticated;
GRANT ALL ON public.product_types TO anon;
GRANT ALL ON public.product_types TO postgres;

-- Grant permissions on properties
GRANT ALL ON public.properties TO service_role;
GRANT ALL ON public.properties TO authenticated;
GRANT ALL ON public.properties TO anon;
GRANT ALL ON public.properties TO postgres;

-- Grant permissions on product_type_properties
GRANT ALL ON public.product_type_properties TO service_role;
GRANT ALL ON public.product_type_properties TO authenticated;
GRANT ALL ON public.product_type_properties TO anon;
GRANT ALL ON public.product_type_properties TO postgres;

-- Grant permissions on products
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.products TO anon;
GRANT ALL ON public.products TO postgres;

-- Grant permissions on product_property_values
GRANT ALL ON public.product_property_values TO service_role;
GRANT ALL ON public.product_property_values TO authenticated;
GRANT ALL ON public.product_property_values TO anon;
GRANT ALL ON public.product_property_values TO postgres;

