-- Disable RLS on all product type system tables
-- This is safe when using service role key for all operations

ALTER TABLE public.product_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_type_properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_property_values DISABLE ROW LEVEL SECURITY;

