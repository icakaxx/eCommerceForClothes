-- Add isdeleted column to products table for soft delete functionality
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS isdeleted boolean NOT NULL DEFAULT false;

-- Create index for better performance on soft delete queries
CREATE INDEX IF NOT EXISTS idx_products_isdeleted ON public.products(isdeleted);

-- Update existing products to have isdeleted = false (if not already set)
UPDATE public.products
SET isdeleted = false
WHERE isdeleted IS NULL;
