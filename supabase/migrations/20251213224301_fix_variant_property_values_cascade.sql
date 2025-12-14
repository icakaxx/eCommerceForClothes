-- Fix foreign key constraint to allow CASCADE DELETE for product_variant_property_values
-- This allows variants to be deleted when they have associated property values

-- First, drop the existing constraint
ALTER TABLE public.product_variant_property_values
DROP CONSTRAINT product_variant_property_values_variantid_fkey;

-- Then recreate it with CASCADE DELETE
ALTER TABLE public.product_variant_property_values
ADD CONSTRAINT product_variant_property_values_variantid_fkey
FOREIGN KEY (ProductVariantID) REFERENCES public.product_variants(ProductVariantID)
ON DELETE CASCADE;
