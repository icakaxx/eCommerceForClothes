-- Variant-level promotional (sale) price for inventory management and storefront display.
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS promotional_price numeric NULL;

ALTER TABLE public.product_variants
  DROP CONSTRAINT IF EXISTS product_variants_promotional_price_check;

ALTER TABLE public.product_variants
  ADD CONSTRAINT product_variants_promotional_price_check
  CHECK (promotional_price IS NULL OR promotional_price >= 0);

COMMENT ON COLUMN public.product_variants.promotional_price IS
  'Optional sale price in BGN. When set and lower than price, shown as promo on storefront.';
