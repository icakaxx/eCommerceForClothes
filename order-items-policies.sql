-- ============================================================================
-- ORDER ITEMS TABLE RLS POLICIES
-- ============================================================================
-- This script creates Row Level Security policies for the order_items table
-- Order items are linked to orders and contain purchase details
-- ============================================================================

-- Enable RLS on order_items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Service role can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;

-- ============================================================================
-- SERVICE ROLE POLICIES (Full Access for Server Operations)
-- ============================================================================

-- Policy: Service role can manage order items
-- This allows full CRUD operations only through the service role key
-- Used by checkout process and admin order management
CREATE POLICY "Service role can manage order items"
ON public.order_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- FUTURE USER POLICIES (When user_id field is added to orders)
-- ============================================================================
-- These policies would be added when orders are linked to authenticated users
-- Order items would inherit permissions from their parent orders

-- Future policy: Users can view their own order items
-- CREATE POLICY "Users can view their own order items"
-- ON public.order_items
-- FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM orders
--     WHERE orders.orderid = order_items.orderid
--     AND orders.user_id = auth.uid()
--   )
-- );

-- Future policy: Users can create order items for their orders
-- CREATE POLICY "Users can create order items for their orders"
-- ON public.order_items
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM orders
--     WHERE orders.orderid = order_items.orderid
--     AND orders.user_id = auth.uid()
--   )
-- );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'order_items';

-- List all policies for order_items
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'order_items'
ORDER BY policyname;

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
-- 1. Order items contain purchase details (products, quantities, prices)
-- 2. NO public read access - order items are only accessible server-side
-- 3. Service role handles order item creation during checkout process
-- 4. Foreign key constraint ensures order items are linked to valid orders
-- 5. Admin access is handled through service role (server-side admin APIs)

-- ============================================================================
-- TESTING THE POLICIES
-- ============================================================================
-- These queries should work (service role bypasses RLS):
-- INSERT INTO order_items (orderid, productid, quantity, price)
-- VALUES ('order-123', 'product-456', 2, 29.99);

-- These queries should FAIL for regular users (blocked by RLS):
-- SELECT * FROM order_items; -- Permission denied
-- INSERT INTO order_items (...) VALUES (...); -- Permission denied
