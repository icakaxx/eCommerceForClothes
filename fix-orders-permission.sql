-- ============================================================================
-- EMERGENCY FIX: Enable Orders Permissions for Service Role
-- ============================================================================
-- Run this SQL immediately in your Supabase SQL Editor to fix the order creation error
-- ============================================================================

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_items table
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

-- Create service role policies that allow full access
CREATE POLICY "Service role can manage orders"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage order items"
ON public.order_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('orders', 'order_items');

-- Check that policies exist
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;

-- ============================================================================
-- TEST QUERY (should work after applying this fix)
-- ============================================================================

-- Test order creation (run this as your service role):
-- INSERT INTO orders (
--   orderid, customerfirstname, customerlastname, customeremail,
--   customertelephone, customercountry, customercity, deliverytype,
--   subtotal, deliverycost, total, status, createdat, updatedat
-- ) VALUES (
--   'TEST-ORD-001', 'Test', 'User', 'test@example.com',
--   '+123456789', 'Bulgaria', 'Sofia', 'office',
--   100.00, 4.50, 104.50, 'pending', NOW(), NOW()
-- );

-- If this works, the permissions are fixed! ✅
