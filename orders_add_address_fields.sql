-- Migration: Add address delivery fields to orders table
-- These fields store the delivery address when delivery type is 'address'

-- Add address fields to the orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS deliverystreet TEXT,
ADD COLUMN IF NOT EXISTS deliverystreetnumber TEXT,
ADD COLUMN IF NOT EXISTS deliveryentrance TEXT,
ADD COLUMN IF NOT EXISTS deliveryfloor TEXT,
ADD COLUMN IF NOT EXISTS deliveryapartment TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN orders.deliverystreet IS 'Street name for address delivery';
COMMENT ON COLUMN orders.deliverystreetnumber IS 'Street number for address delivery';
COMMENT ON COLUMN orders.deliveryentrance IS 'Building entrance for address delivery (optional)';
COMMENT ON COLUMN orders.deliveryfloor IS 'Floor number for address delivery (optional)';
COMMENT ON COLUMN orders.deliveryapartment IS 'Apartment number for address delivery (optional)';

-- Create indexes for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_orders_deliverystreet ON orders(deliverystreet);
CREATE INDEX IF NOT EXISTS idx_orders_deliverytype ON orders(deliverytype);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('deliverystreet', 'deliverystreetnumber', 'deliveryentrance', 'deliveryfloor', 'deliveryapartment');

