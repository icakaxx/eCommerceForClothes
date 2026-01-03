-- Migration: Add subtitle field to products table
-- Description: Adds a subtitle field to allow product subtitles like "Close fit", "Loose fit", etc.
-- Run this in your Supabase SQL editor or PostgreSQL client

-- Add subtitle column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS subtitle text;

-- Add comment to document the field
COMMENT ON COLUMN public.products.subtitle IS 'Product subtitle for additional product information (e.g., "Close fit", "Loose fit")';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'products' 
  AND column_name = 'subtitle';



