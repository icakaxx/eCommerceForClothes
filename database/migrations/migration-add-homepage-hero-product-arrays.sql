-- Multiple products per homepage hero card (curated mini-shop pages).
-- Run after migration-add-homepage-hero-products.sql if you use the single-UUID columns.

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS hero_jackets_productids uuid[] DEFAULT '{}';

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS hero_formal_productids uuid[] DEFAULT '{}';

UPDATE public.store_settings
SET
  hero_jackets_productids = ARRAY[hero_jackets_productid]
WHERE hero_jackets_productid IS NOT NULL
  AND (hero_jackets_productids IS NULL OR cardinality(hero_jackets_productids) = 0);

UPDATE public.store_settings
SET
  hero_formal_productids = ARRAY[hero_formal_productid]
WHERE hero_formal_productid IS NOT NULL
  AND (hero_formal_productids IS NULL OR cardinality(hero_formal_productids) = 0);

COMMENT ON COLUMN public.store_settings.hero_jackets_productids IS 'Products on /hero/jackets (homepage Jackets card)';
COMMENT ON COLUMN public.store_settings.hero_formal_productids IS 'Products on /hero/formal (homepage formal-wear card)';
