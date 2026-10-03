-- Migration: Add hero image focus point columns to store_settings table
-- This allows admins to set a focus point for the hero image to ensure
-- important areas remain visible on both mobile and desktop views

ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS heroimagefocusx numeric DEFAULT 50 CHECK (heroimagefocusx >= 0 AND heroimagefocusx <= 100),
ADD COLUMN IF NOT EXISTS heroimagefocusy numeric DEFAULT 50 CHECK (heroimagefocusy >= 0 AND heroimagefocusy <= 100);

-- Update existing records to have default center focus point
UPDATE store_settings 
SET heroimagefocusx = 50, heroimagefocusy = 50 
WHERE heroimagefocusx IS NULL OR heroimagefocusy IS NULL;
