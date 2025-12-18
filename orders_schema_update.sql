-- Updated orders table schema
-- This schema reflects the new structure with customerid reference

-- NOTE: Before running this, make sure to:
-- 1. Run customers_schema.sql to create the customers table
-- 2. Run migrate_customers.sql to migrate existing data
-- 3. Verify all orders have customerid populated

-- Step 1: Add customerid column (if not already added by migration)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customerid UUID;

-- Step 2: Create index on customerid
CREATE INDEX IF NOT EXISTS idx_orders_customerid ON public.orders(customerid);

-- Step 3: Add discount information columns
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS discountcode TEXT,
ADD COLUMN IF NOT EXISTS discounttype TEXT,
ADD COLUMN IF NOT EXISTS discountvalue NUMERIC,
ADD COLUMN IF NOT EXISTS discountamount NUMERIC DEFAULT 0;

-- Step 4: Make customerid NOT NULL (run after migration)
-- Uncomment the following line after verifying all orders have customerid
-- ALTER TABLE public.orders ALTER COLUMN customerid SET NOT NULL;

-- Step 5: Add foreign key constraint (run after migration)
-- Uncomment after verifying data integrity
-- ALTER TABLE public.orders 
-- ADD CONSTRAINT orders_customerid_fkey 
-- FOREIGN KEY (customerid) 
-- REFERENCES public.customers(customerid) 
-- ON DELETE RESTRICT;

-- Step 6: Drop old customer columns (ONLY after full migration and testing)
-- Uncomment these lines one by one after thorough testing
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS customerfirstname;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS customerlastname;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS customeremail;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS customertelephone;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS customercountry;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS customercity;

-- View updated orders table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

