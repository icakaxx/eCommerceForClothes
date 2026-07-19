-- When true, product stays visible on the storefront as "out of stock / awaiting restock"
-- (greyed card with overlay). Run in the Supabase SQL editor before deploying.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS awaitingrestock boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.awaitingrestock IS
  'If true, product is shown greyed out on the shop with out-of-stock / restock-soon messaging.';
