-- ============================================================================
-- ORDERS & ORDER ITEMS RLS POLICIES
-- ============================================================================
-- This script creates Row Level Security policies for orders and order_items tables
-- Orders contain highly sensitive customer data and must be tightly controlled
-- ============================================================================

-- Enable RLS on orders and order_items tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;

DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Service role can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================

-- Policy: Service role can manage orders
-- This allows full CRUD operations only through the service role key
-- Used by checkout process (/api/orders) and admin order management
CREATE POLICY "Service role can manage orders"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ORDER ITEMS TABLE POLICIES
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
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that RLS is enabled on both tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('orders', 'order_items')
ORDER BY tablename;

-- List all policies for orders and order_items
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;

-- ============================================================================
-- SECURITY DESIGN PRINCIPLES
-- ============================================================================

-- 1. ZERO PUBLIC ACCESS
-- Orders and order items contain sensitive customer data:
-- - Customer names, emails, phone numbers, addresses
-- - Purchase history, product details, payment information
-- - NO public read access under any circumstances

-- 2. SERVICE ROLE ONLY ACCESS
-- All order operations must go through server-side APIs:
-- - Checkout process uses /api/orders (service role)
-- - Admin dashboard uses service role for order management
-- - No client-side direct database access to orders

-- 3. FUTURE USER ACCESS (When user authentication is added)
-- When orders are linked to authenticated users:
-- - Users can view their own order history
-- - Users can create orders through checkout
-- - Admins retain full access through service role

-- ============================================================================
-- TESTING THE POLICIES
-- ============================================================================

-- ✅ These operations work (service role bypasses RLS):
-- INSERT INTO orders (orderid, customerfirstname, customerlastname, customeremail, ...)
-- VALUES ('ORD-123', 'John', 'Doe', 'john@example.com', ...);

-- INSERT INTO order_items (orderid, productid, quantity, price)
-- VALUES ('ORD-123', 'product-456', 2, 29.99);

-- SELECT * FROM orders WHERE orderid = 'ORD-123';
-- SELECT * FROM order_items WHERE orderid = 'ORD-123';

-- ❌ These operations FAIL for regular users (blocked by RLS):
-- SELECT * FROM orders; -- Permission denied for table orders
-- SELECT * FROM order_items; -- Permission denied for table order_items
-- INSERT INTO orders (...) VALUES (...); -- Permission denied
-- INSERT INTO order_items (...) VALUES (...); -- Permission denied

-- ============================================================================
-- IMPLEMENTATION NOTES
-- ============================================================================

-- Current Implementation:
-- - Orders created through /api/orders POST (service role)
-- - No user authentication required for checkout
-- - All order data handled server-side only

-- Future Enhancements:
-- - Add user_id field to orders table
-- - Implement user-specific policies for order history
-- - Add order status tracking and updates
-- - Implement order cancellation logic
