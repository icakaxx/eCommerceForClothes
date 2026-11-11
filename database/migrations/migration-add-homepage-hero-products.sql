-- Homepage hero cards: assign a product to Jackets and Formal-wear cards.
-- Nike Tech card stays as an outbound URL and is not stored here.
-- Run once in Supabase SQL Editor. Does not rewrite historical settings.

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS hero_jackets_productid uuid REFERENCES public.products(productid) ON DELETE SET NULL;

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS hero_formal_productid uuid REFERENCES public.products(productid) ON DELETE SET NULL;

COMMENT ON COLUMN public.store_settings.hero_jackets_productid IS 'Product shown on the homepage Jackets hero card';
COMMENT ON COLUMN public.store_settings.hero_formal_productid IS 'Product shown on the homepage shirts/trousers/formal hero card';

-- Optional: for multiple products per card, also run migration-add-homepage-hero-product-arrays.sql
