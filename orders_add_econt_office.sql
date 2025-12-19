-- Migration: Add Econt Office field to orders table
-- This field stores the selected Econt office ID when delivery type is 'office'

-- Add the econtoffice column to the orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS econtoffice TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN orders.econtoffice IS 'Econt office ID selected by customer for office delivery';

-- Create an index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_orders_econtoffice ON orders(econtoffice);

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'econtoffice';

