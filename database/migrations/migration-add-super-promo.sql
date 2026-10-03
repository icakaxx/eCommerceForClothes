-- Migration: SUPER PROMO items — chosen product variants with custom promo prices

CREATE TABLE IF NOT EXISTS public.super_promo_items (
  superpromoid uuid NOT NULL DEFAULT gen_random_uuid(),
  productid uuid NOT NULL,
  productvariantid uuid NOT NULL,
  promoprice numeric(10, 2) NOT NULL CHECK (promoprice > 0),
  sortorder integer NOT NULL DEFAULT 0,
  isactive boolean NOT NULL DEFAULT true,
  createdat timestamp with time zone NOT NULL DEFAULT now(),
  updatedat timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT super_promo_items_pkey PRIMARY KEY (superpromoid),
  CONSTRAINT super_promo_items_productvariantid_key UNIQUE (productvariantid)
);

CREATE INDEX IF NOT EXISTS idx_super_promo_items_active_sort
  ON public.super_promo_items (isactive, sortorder);

CREATE INDEX IF NOT EXISTS idx_super_promo_items_productid
  ON public.super_promo_items (productid);

COMMENT ON TABLE public.super_promo_items IS
  'Storefront SUPER PROMO page entries: specific variants with admin-set promo prices.';
