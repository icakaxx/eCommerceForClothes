-- ============================================================================
-- SERVICE ROLE WRITE PERMISSIONS
-- ============================================================================
-- This script ensures all tables have proper write permissions for service role
-- Service role (API key) needs write access for server-side operations
-- ============================================================================

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_property_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_property_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SERVICE ROLE WRITE POLICIES FOR ALL TABLES
-- ============================================================================
-- These policies allow the service role (API key) to perform all operations
-- Used by server-side APIs for admin operations and data management

-- Products table
CREATE POLICY "Service role can manage products"
ON public.products
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Product variants table
CREATE POLICY "Service role can manage product variants"
ON public.product_variants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Product types table
CREATE POLICY "Service role can manage product types"
ON public.product_types
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Properties table
CREATE POLICY "Service role can manage properties"
ON public.properties
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Property values table
CREATE POLICY "Service role can manage property values"
ON public.property_values
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Product property values table
CREATE POLICY "Service role can manage product property values"
ON public.product_property_values
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Product variant property values table
CREATE POLICY "Service role can manage product variant property values"
ON public.product_variant_property_values
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Product images table
CREATE POLICY "Service role can manage product images"
ON public.product_images
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Orders table (already exists, but ensuring it's correct)
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;
CREATE POLICY "Service role can manage orders"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Order items table (already exists, but ensuring it's correct)
DROP POLICY IF EXISTS "Service role can manage order items" ON public.order_items;
CREATE POLICY "Service role can manage order items"
ON public.order_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Store settings table
DROP POLICY IF EXISTS "Service role can manage store settings" ON public.store_settings;
CREATE POLICY "Service role can manage store settings"
ON public.store_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Profiles table (for user management)
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
CREATE POLICY "Service role can manage profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that all tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE 'storage.%'
ORDER BY tablename;

-- Check service role policies exist for all tables
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%Service role%'
ORDER BY tablename, policyname;

-- Count of service role policies per table
SELECT
    tablename,
    COUNT(*) as service_role_policies
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%Service role%'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- SECURITY PRINCIPLES FOR SERVICE ROLE
-- ============================================================================

-- 1. SERVICE ROLE BYPASSES RLS COMPLETELY
-- The service role key allows full access to all tables regardless of RLS policies
-- This is the intended behavior for server-side API operations

-- 2. API ROUTES USE SERVICE ROLE
-- All admin API routes should use the service role client:
-- - /api/products/* (product management)
-- - /api/orders/* (order processing)
-- - /api/store-settings/* (store configuration)
-- - /api/properties/* (product properties)
-- - /api/product-types/* (product categories)

-- 3. CLIENT-SIDE NEVER USES SERVICE ROLE
-- The service role key should NEVER be exposed to client-side code
-- Client-side operations use either:
--   - Public policies (for reading public data)
--   - Authenticated user policies (for user-specific data)

-- 4. ADMIN OPERATIONS REQUIRE SERVICE ROLE
-- Any operation that modifies sensitive data must go through:
--   - Server-side API routes
--   - Service role client
--   - Proper authentication checks

-- ============================================================================
-- TESTING SERVICE ROLE PERMISSIONS
-- ============================================================================

-- These operations should work when called from server-side APIs:

-- ✅ Product Management
-- INSERT INTO products (name, skU, producttypeid) VALUES ('Test Product', 'TEST-001', '...');
-- UPDATE products SET name = 'Updated Product' WHERE productid = '...';
-- DELETE FROM products WHERE productid = '...';

-- ✅ Order Processing
-- INSERT INTO orders (orderid, customerfirstname, customerlastname, customeremail, ...)
-- VALUES ('ORD-123', 'John', 'Doe', 'john@example.com', ...);
-- UPDATE orders SET status = 'completed' WHERE orderid = 'ORD-123';

-- ✅ Store Settings
-- UPDATE store_settings SET storename = 'New Store Name' WHERE storesettingsid = '...';

-- ✅ User Management (if needed)
-- INSERT INTO profiles (id, email, role) VALUES ('user-id', 'user@example.com', 'customer');
-- UPDATE profiles SET role = 'admin' WHERE id = 'user-id';

-- ============================================================================
-- IMPLEMENTATION CHECKLIST
-- ============================================================================

-- ✅ Enable RLS on all public tables
-- ✅ Create service role policies for all tables
-- ✅ Verify API routes use service role client
-- ✅ Ensure service role key is not exposed to client
-- ✅ Test admin operations work through APIs
-- ✅ Verify client-side operations are properly restricted
