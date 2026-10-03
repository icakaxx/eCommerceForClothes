-- Create favorite_products table for user product favorites
CREATE TABLE IF NOT EXISTS public.favorite_products (
  favoriteid uuid NOT NULL DEFAULT gen_random_uuid(),
  userid uuid NOT NULL,
  productid uuid NOT NULL,
  createdat timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT favorite_products_pkey PRIMARY KEY (favoriteid),
  CONSTRAINT favorite_products_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE,
  CONSTRAINT favorite_products_productid_fkey FOREIGN KEY (productid) REFERENCES public.products(productid) ON DELETE CASCADE,
  CONSTRAINT favorite_products_unique UNIQUE (userid, productid)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_favorite_products_userid ON public.favorite_products(userid);
CREATE INDEX IF NOT EXISTS idx_favorite_products_productid ON public.favorite_products(productid);

-- Add comments for documentation
COMMENT ON TABLE public.favorite_products IS 'Stores user favorite products';
COMMENT ON COLUMN public.favorite_products.favoriteid IS 'Unique identifier for the favorite record';
COMMENT ON COLUMN public.favorite_products.userid IS 'Reference to the user who favorited the product';
COMMENT ON COLUMN public.favorite_products.productid IS 'Reference to the favorited product';
COMMENT ON COLUMN public.favorite_products.createdat IS 'Timestamp when the product was favorited';
