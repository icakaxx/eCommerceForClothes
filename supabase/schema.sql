-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.product_images (
  ProductImageID uuid NOT NULL DEFAULT gen_random_uuid(),
  ProductID uuid NOT NULL,
  ProductVariantID uuid,
  ImageURL text NOT NULL,
  AltText text,
  SortOrder integer NOT NULL DEFAULT 0,
  IsPrimary boolean NOT NULL DEFAULT false,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_images_pkey PRIMARY KEY (ProductImageID),
  CONSTRAINT product_images_productid_fkey FOREIGN KEY (ProductID) REFERENCES public.products(ProductID),
  CONSTRAINT product_images_variantid_fkey FOREIGN KEY (ProductVariantID) REFERENCES public.product_variants(ProductVariantID)
);
CREATE TABLE public.product_property_values (
  ProductPropertyValueID uuid NOT NULL DEFAULT gen_random_uuid(),
  ProductID uuid NOT NULL,
  PropertyID uuid NOT NULL,
  Value text NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_property_values_pkey PRIMARY KEY (ProductPropertyValueID),
  CONSTRAINT product_property_values_productid_fkey FOREIGN KEY (ProductID) REFERENCES public.products(ProductID),
  CONSTRAINT product_property_values_propertyid_fkey FOREIGN KEY (PropertyID) REFERENCES public.properties(PropertyID)
);
CREATE TABLE public.product_type_properties (
  ProductTypePropertyID uuid NOT NULL DEFAULT gen_random_uuid(),
  ProductTypeID uuid NOT NULL,
  PropertyID uuid NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_type_properties_pkey PRIMARY KEY (ProductTypePropertyID),
  CONSTRAINT product_type_properties_producttypeid_fkey FOREIGN KEY (ProductTypeID) REFERENCES public.product_types(ProductTypeID),
  CONSTRAINT product_type_properties_propertyid_fkey FOREIGN KEY (PropertyID) REFERENCES public.properties(PropertyID)
);
CREATE TABLE public.product_types (
  ProductTypeID uuid NOT NULL DEFAULT gen_random_uuid(),
  Name text NOT NULL,
  Code text NOT NULL UNIQUE,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_types_pkey PRIMARY KEY (ProductTypeID)
);
CREATE TABLE public.product_variant_property_values (
  ProductVariantPropertyValueID uuid NOT NULL DEFAULT gen_random_uuid(),
  ProductVariantID uuid NOT NULL,
  PropertyID uuid NOT NULL,
  Value text NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_variant_property_values_pkey PRIMARY KEY (ProductVariantPropertyValueID),
  CONSTRAINT product_variant_property_values_variantid_fkey FOREIGN KEY (ProductVariantID) REFERENCES public.product_variants(ProductVariantID),
  CONSTRAINT product_variant_property_values_propertyid_fkey FOREIGN KEY (PropertyID) REFERENCES public.properties(PropertyID)
);
CREATE TABLE public.product_variants (
  ProductVariantID uuid NOT NULL DEFAULT gen_random_uuid(),
  ProductID uuid NOT NULL,
  SKU text UNIQUE,
  Price numeric CHECK ("Price" >= 0::numeric),
  CompareAtPrice numeric,
  Cost numeric,
  Quantity integer NOT NULL DEFAULT 0 CHECK ("Quantity" >= 0),
  Weight numeric CHECK ("Weight" >= 0::numeric),
  WeightUnit text DEFAULT 'kg'::text CHECK ("WeightUnit" = ANY (ARRAY['kg'::text, 'g'::text, 'lb'::text, 'oz'::text])),
  Barcode text,
  TrackQuantity boolean NOT NULL DEFAULT true,
  ContinueSellingWhenOutOfStock boolean NOT NULL DEFAULT false,
  IsVisible boolean NOT NULL DEFAULT true,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_variants_pkey PRIMARY KEY (ProductVariantID),
  CONSTRAINT product_variants_productid_fkey FOREIGN KEY (ProductID) REFERENCES public.products(ProductID)
);
CREATE TABLE public.products (
  ProductID uuid NOT NULL DEFAULT gen_random_uuid(),
  Name text NOT NULL,
  SKU text UNIQUE,
  Description text,
  ProductTypeID uuid NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (ProductID),
  CONSTRAINT products_producttypeid_fkey FOREIGN KEY (ProductTypeID) REFERENCES public.product_types(ProductTypeID)
);
CREATE TABLE public.properties (
  PropertyID uuid NOT NULL DEFAULT gen_random_uuid(),
  Name text NOT NULL,
  Description text,
  DataType text NOT NULL DEFAULT 'text'::text CHECK ("DataType" = ANY (ARRAY['text'::text, 'select'::text, 'number'::text])),
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT properties_pkey PRIMARY KEY (PropertyID)
);
CREATE TABLE public.property_values (
  PropertyValueID uuid NOT NULL DEFAULT gen_random_uuid(),
  PropertyID uuid NOT NULL,
  Value text NOT NULL,
  DisplayOrder integer NOT NULL DEFAULT 0,
  IsActive boolean NOT NULL DEFAULT true,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT property_values_pkey PRIMARY KEY (PropertyValueID),
  CONSTRAINT property_values_propertyid_fkey FOREIGN KEY (PropertyID) REFERENCES public.properties(PropertyID)
);
CREATE TABLE public.store_settings (
  StoreSettingsID uuid NOT NULL DEFAULT gen_random_uuid(),
  StoreName text NOT NULL DEFAULT 'ModaBox',
  LogoUrl text,
  ThemeId text NOT NULL DEFAULT 'default',
  Language text NOT NULL DEFAULT 'en' CHECK ("Language" = ANY (ARRAY['en'::text, 'bg'::text])),
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT store_settings_pkey PRIMARY KEY (StoreSettingsID)
);