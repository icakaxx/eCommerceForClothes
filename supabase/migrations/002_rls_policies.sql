-- RLS Policies for Product Type System Tables
-- This allows public read access and authenticated write access

-- Product Types Policies
CREATE POLICY "Public can read product types"
ON public.product_types
FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can insert product types"
ON public.product_types
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update product types"
ON public.product_types
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product types"
ON public.product_types
FOR DELETE
TO authenticated
USING (true);

-- Properties Policies
CREATE POLICY "Public can read properties"
ON public.properties
FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can insert properties"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update properties"
ON public.properties
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete properties"
ON public.properties
FOR DELETE
TO authenticated
USING (true);

-- Product Type Properties Policies
CREATE POLICY "Public can read product type properties"
ON public.product_type_properties
FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can insert product type properties"
ON public.product_type_properties
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update product type properties"
ON public.product_type_properties
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product type properties"
ON public.product_type_properties
FOR DELETE
TO authenticated
USING (true);

-- Products Policies
CREATE POLICY "Public can read products"
ON public.products
FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (true);

-- Product Property Values Policies
CREATE POLICY "Public can read product property values"
ON public.product_property_values
FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can insert product property values"
ON public.product_property_values
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update product property values"
ON public.product_property_values
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product property values"
ON public.product_property_values
FOR DELETE
TO authenticated
USING (true);

