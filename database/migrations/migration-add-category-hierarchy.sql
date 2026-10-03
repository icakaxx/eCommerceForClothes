-- Migration: Add parent_producttypeid to product_types table for category hierarchy
-- This enables a 3-level hierarchy: rfproducttype -> product_types (parent) -> product_types (child)

-- Add parent_producttypeid column (nullable, allows existing categories to remain at level 2)
ALTER TABLE public.product_types
ADD COLUMN IF NOT EXISTS parent_producttypeid uuid;

-- Add foreign key constraint to self-reference product_types table
ALTER TABLE public.product_types
ADD CONSTRAINT product_types_parent_producttypeid_fkey 
FOREIGN KEY (parent_producttypeid) 
REFERENCES public.product_types(producttypeid) 
ON DELETE SET NULL;

-- Add index for better query performance on parent lookups
CREATE INDEX IF NOT EXISTS idx_product_types_parent_producttypeid 
ON public.product_types(parent_producttypeid);

-- Note: Application-level validation will ensure:
-- 1. Products can only be assigned to leaf categories (categories with no children)
-- 2. Maximum depth of 3 levels (rfproducttype -> product_types -> product_types)
-- 3. No circular references in parent relationships
