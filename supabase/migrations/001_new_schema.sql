-- Migration: New Product Type System Schema
-- All column names use PascalCase format
-- ID columns follow [TableName]ID convention

-- 1. Product Types Table
CREATE TABLE IF NOT EXISTS public.product_types (
  "ProductTypeID" uuid NOT NULL DEFAULT gen_random_uuid(),
  "Name" text NOT NULL,
  "Code" text NOT NULL UNIQUE,
  "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "UpdatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_types_pkey PRIMARY KEY ("ProductTypeID")
);

-- 2. Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
  "PropertyID" uuid NOT NULL DEFAULT gen_random_uuid(),
  "Name" text NOT NULL,
  "Description" text,
  "DataType" text NOT NULL DEFAULT 'text',
  "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "UpdatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT properties_pkey PRIMARY KEY ("PropertyID"),
  CONSTRAINT properties_datatype_check CHECK ("DataType" IN ('text', 'select', 'number'))
);

-- 3. Product Type Properties Junction Table
CREATE TABLE IF NOT EXISTS public.product_type_properties (
  "ProductTypePropertyID" uuid NOT NULL DEFAULT gen_random_uuid(),
  "ProductTypeID" uuid NOT NULL,
  "PropertyID" uuid NOT NULL,
  "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_type_properties_pkey PRIMARY KEY ("ProductTypePropertyID"),
  CONSTRAINT product_type_properties_producttypeid_fkey FOREIGN KEY ("ProductTypeID") REFERENCES public.product_types("ProductTypeID") ON DELETE CASCADE,
  CONSTRAINT product_type_properties_propertyid_fkey FOREIGN KEY ("PropertyID") REFERENCES public.properties("PropertyID") ON DELETE CASCADE,
  CONSTRAINT product_type_properties_unique UNIQUE ("ProductTypeID", "PropertyID")
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  "ProductID" uuid NOT NULL DEFAULT gen_random_uuid(),
  "Name" text NOT NULL,
  "SKU" text UNIQUE,
  "Description" text,
  "ProductTypeID" uuid NOT NULL,
  "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "UpdatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY ("ProductID"),
  CONSTRAINT products_producttypeid_fkey FOREIGN KEY ("ProductTypeID") REFERENCES public.product_types("ProductTypeID") ON DELETE RESTRICT
);

-- 5. Product Property Values Table
CREATE TABLE IF NOT EXISTS public.product_property_values (
  "ProductPropertyValueID" uuid NOT NULL DEFAULT gen_random_uuid(),
  "ProductID" uuid NOT NULL,
  "PropertyID" uuid NOT NULL,
  "Value" text NOT NULL,
  "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "UpdatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_property_values_pkey PRIMARY KEY ("ProductPropertyValueID"),
  CONSTRAINT product_property_values_productid_fkey FOREIGN KEY ("ProductID") REFERENCES public.products("ProductID") ON DELETE CASCADE,
  CONSTRAINT product_property_values_propertyid_fkey FOREIGN KEY ("PropertyID") REFERENCES public.properties("PropertyID") ON DELETE CASCADE,
  CONSTRAINT product_property_values_unique UNIQUE ("ProductID", "PropertyID")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_types_code ON public.product_types("Code");
CREATE INDEX IF NOT EXISTS idx_products_producttypeid ON public.products("ProductTypeID");
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products("SKU");
CREATE INDEX IF NOT EXISTS idx_product_type_properties_producttypeid ON public.product_type_properties("ProductTypeID");
CREATE INDEX IF NOT EXISTS idx_product_type_properties_propertyid ON public.product_type_properties("PropertyID");
CREATE INDEX IF NOT EXISTS idx_product_property_values_productid ON public.product_property_values("ProductID");
CREATE INDEX IF NOT EXISTS idx_product_property_values_propertyid ON public.product_property_values("PropertyID");

-- RLS disabled - using service role key for all operations
-- If you need RLS later, enable it and add policies
-- ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.product_type_properties ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.product_property_values ENABLE ROW LEVEL SECURITY;

