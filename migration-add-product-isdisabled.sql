-- When true, the product is hidden from the storefront (still manageable in admin).
-- Run this in the Supabase SQL editor before deploying the feature.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS isdisabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.isdisabled IS 'If true, product is not listed or viewable on the customer-facing shop.';
