-- Migration: Add related products table
-- Description: Allows manual configuration of related products for cross-selling
-- Run this in your Supabase SQL editor or PostgreSQL client

-- Create related_products table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.related_products (
  relatedproductid uuid NOT NULL DEFAULT gen_random_uuid(),
  productid uuid NOT NULL,
  relatedproductid_ref uuid NOT NULL,
  displayorder integer NOT NULL DEFAULT 0,
  createdat timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT related_products_pkey PRIMARY KEY (relatedproductid),
  CONSTRAINT related_products_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE,
  CONSTRAINT related_products_relatedproductid_fkey FOREIGN KEY (relatedproductid_ref) REFERENCES public.products(productid) ON DELETE CASCADE,
  CONSTRAINT related_products_unique UNIQUE (productid, relatedproductid_ref),
  CONSTRAINT related_products_no_self_reference CHECK (productid != relatedproductid_ref)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_related_products_productid ON public.related_products(productid);
CREATE INDEX IF NOT EXISTS idx_related_products_relatedproductid_ref ON public.related_products(relatedproductid_ref);

-- Add comment to document the table
COMMENT ON TABLE public.related_products IS 'Stores manually configured related products for cross-selling';
COMMENT ON COLUMN public.related_products.productid IS 'The main product ID';
COMMENT ON COLUMN public.related_products.relatedproductid_ref IS 'The related product ID to show';
COMMENT ON COLUMN public.related_products.displayorder IS 'Order in which to display the related products (lower numbers first)';

-- Verify the table was created
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'related_products'
ORDER BY ordinal_position;


