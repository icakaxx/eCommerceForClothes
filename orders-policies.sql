-- ============================================================================
-- ORDERS TABLE RLS POLICIES
-- ============================================================================
-- This script creates Row Level Security policies for the orders table
-- Orders contain sensitive customer data and should be highly restricted
-- ============================================================================

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;

-- ============================================================================
-- SERVICE ROLE POLICIES (Full Access for Server Operations)
-- ============================================================================

-- Policy: Service role can manage orders
-- This allows full CRUD operations only through the service role key
-- Used by checkout process and admin order management
CREATE POLICY "Service role can manage orders"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- FUTURE USER POLICIES (When user_id field is added)
-- ============================================================================
-- These policies would be added when orders are linked to authenticated users
-- For now, orders are only accessible through service role (server-side only)

-- Future policy: Users can view their own orders
-- CREATE POLICY "Users can view their own orders"
-- ON public.orders
-- FOR SELECT
-- TO authenticated
-- USING (auth.uid() = user_id);

-- Future policy: Users can create their own orders
-- CREATE POLICY "Users can create their own orders"
-- ON public.orders
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'orders';

-- List all policies for orders
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'orders'
ORDER BY policyname;

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
-- 1. Orders contain sensitive customer data (names, emails, addresses, payment info)
-- 2. NO public read access - orders are only accessible server-side
-- 3. Service role handles order creation during checkout process
-- 4. Future enhancement: Add user_id field to allow customers to view their order history
-- 5. Admin access is handled through service role (server-side admin APIs)

-- ============================================================================
-- TESTING THE POLICIES
-- ============================================================================
-- These queries should work (service role bypasses RLS):
-- INSERT INTO orders (customerfirstname, customerlastname, customeremail, ...)
-- VALUES ('Test', 'User', 'test@example.com', ...);
-- SELECT * FROM orders WHERE orderid = 'some-order-id';

-- These queries should FAIL for regular users (blocked by RLS):
-- SELECT * FROM orders; -- Permission denied
-- INSERT INTO orders (...) VALUES (...); -- Permission denied
