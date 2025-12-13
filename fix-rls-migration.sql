-- Emergency RLS Fix for Order Creation
-- Run this in Supabase SQL Editor to fix the permission denied error

-- Enable RLS on orders table (if not already enabled)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies that might be blocking service role
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

-- Create service role policy that allows full access
CREATE POLICY "Service role can manage orders"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Same for order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;

CREATE POLICY "Service role can manage order items"
ON public.order_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify RLS is enabled and policies exist
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('orders', 'order_items');

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;
