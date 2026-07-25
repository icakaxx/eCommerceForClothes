-- Product-level promo discount (%). When > 0, storefront shows
-- original price, sale price, and a "ПРОМОЦИЯ" badge on the card.
-- Run in the Supabase SQL editor before deploying.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS promodiscountpercent numeric(5, 2) NULL;

COMMENT ON COLUMN public.products.promodiscountpercent IS
  'Percentage discount for storefront ПРОМОЦИЯ label (e.g. 20 = 20% off). NULL or 0 = no promo.';
