-- Migration script to extract customers from orders table
-- Run this AFTER creating the customers table

-- Step 1: Extract unique customers from orders table and insert into customers table
INSERT INTO public.customers (firstname, lastname, email, telephone, country, city, createdat, updatedat)
SELECT DISTINCT
    customerfirstname,
    customerlastname,
    customeremail,
    customertelephone,
    customercountry,
    customercity,
    MIN(createdat) as createdat,  -- Use earliest order date as customer creation date
    NOW() as updatedat
FROM public.orders
WHERE customeremail IS NOT NULL
GROUP BY 
    customerfirstname, 
    customerlastname, 
    customeremail, 
    customertelephone, 
    customercountry, 
    customercity
ON CONFLICT (email) DO NOTHING;  -- Skip if email already exists

-- Step 2: Add customerid column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customerid UUID;

-- Step 3: Update orders with customerid based on email match
UPDATE public.orders o
SET customerid = c.customerid
FROM public.customers c
WHERE o.customeremail = c.email
  AND o.customerid IS NULL;

-- Step 4: Make customerid NOT NULL after migration
-- Run this after verifying all orders have customerid
-- ALTER TABLE public.orders ALTER COLUMN customerid SET NOT NULL;

-- Step 5: Add foreign key constraint
-- ALTER TABLE public.orders 
-- ADD CONSTRAINT orders_customerid_fkey 
-- FOREIGN KEY (customerid) 
-- REFERENCES public.customers(customerid) 
-- ON DELETE RESTRICT;

-- Step 6: Create index on customerid
CREATE INDEX IF NOT EXISTS idx_orders_customerid ON public.orders(customerid);

-- Step 7: Drop old customer columns from orders (run this after verifying migration)
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS customerfirstname;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS customerlastname;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS customeremail;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS customertelephone;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS customercountry;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS customercity;

-- Verification queries:
-- Check customers created
SELECT COUNT(*) as total_customers FROM public.customers;

-- Check orders with customerid
SELECT COUNT(*) as orders_with_customerid FROM public.orders WHERE customerid IS NOT NULL;

-- Check orders without customerid (should be 0 after migration)
SELECT COUNT(*) as orders_without_customerid FROM public.orders WHERE customerid IS NULL;

-- View sample data
SELECT 
    o.orderid,
    c.firstname,
    c.lastname,
    c.email,
    o.total
FROM public.orders o
JOIN public.customers c ON o.customerid = c.customerid
LIMIT 10;

