-- ============================================================================
-- VERIFY SERVICE ROLE PERMISSIONS
-- ============================================================================
-- Run these queries to verify that service role has proper write permissions
-- ============================================================================

-- 1. Check RLS is enabled on all public tables
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE 'storage.%'
AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- 2. Check service role policies exist for all tables
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    permissive
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%Service role%'
ORDER BY tablename, policyname;

-- 3. Count service role policies per table (should be 1 per table)
SELECT
    tablename,
    COUNT(*) as service_role_policies,
    STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%Service role%'
GROUP BY tablename
ORDER BY tablename;

-- 4. Check for any tables missing service role policies
SELECT
    t.tablename,
    CASE WHEN p.policyname IS NULL THEN 'MISSING SERVICE ROLE POLICY' ELSE 'HAS SERVICE ROLE POLICY' END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
    AND p.schemaname = 'public'
    AND p.policyname LIKE '%Service role%'
WHERE t.schemaname = 'public'
AND t.tablename NOT LIKE 'storage.%'
AND t.tablename NOT LIKE 'pg_%'
ORDER BY t.tablename;

-- 5. Verify policy details (should allow ALL operations for service_role)
SELECT
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%Service role%'
ORDER BY tablename, policyname;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================

-- ✅ RLS should be enabled (rowsecurity = true) for all public tables
-- ✅ Each table should have exactly 1 service role policy
-- ✅ Policy should allow FOR ALL operations (cmd = '*')
-- ✅ Policy should target service_role (roles = '{service_role}')
-- ✅ Policy should have no restrictions (qual = null, with_check = null)

-- ============================================================================
-- MANUAL TESTING
-- ============================================================================

-- Test service role can write (run these as service role):
-- INSERT INTO products (name, sku, producttypeid, updatedat)
-- VALUES ('Test Product', 'TEST-001', (SELECT producttypeid FROM product_types LIMIT 1), NOW());

-- INSERT INTO orders (orderid, customerfirstname, customerlastname, customeremail,
--                    customertelephone, customercountry, customercity, deliverytype,
--                    subtotal, deliverycost, total, status, createdat, updatedat)
-- VALUES ('TEST-ORD-001', 'Test', 'User', 'test@example.com', '+123456789',
--         'Test Country', 'Test City', 'office', 100.00, 5.00, 105.00, 'pending', NOW(), NOW());

-- UPDATE store_settings SET storename = 'Test Store Name' WHERE storesettingsid IS NOT NULL;

-- If these work, service role permissions are correctly configured! ✅
