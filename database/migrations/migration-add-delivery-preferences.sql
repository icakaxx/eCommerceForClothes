-- Add delivery preference columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS preferred_delivery_type text,
ADD COLUMN IF NOT EXISTS preferred_econt_office_id text,
ADD COLUMN IF NOT EXISTS preferred_city text,
ADD COLUMN IF NOT EXISTS preferred_street text,
ADD COLUMN IF NOT EXISTS preferred_street_number text,
ADD COLUMN IF NOT EXISTS preferred_entrance text,
ADD COLUMN IF NOT EXISTS preferred_floor text,
ADD COLUMN IF NOT EXISTS preferred_apartment text;

-- Add comments for documentation
COMMENT ON COLUMN public.users.preferred_delivery_type IS 'Preferred delivery type: office, address, or econtomat';
COMMENT ON COLUMN public.users.preferred_econt_office_id IS 'Preferred Econt office ID for office delivery';
COMMENT ON COLUMN public.users.preferred_city IS 'Preferred city for delivery';
COMMENT ON COLUMN public.users.preferred_street IS 'Preferred street for address delivery';
COMMENT ON COLUMN public.users.preferred_street_number IS 'Preferred street number for address delivery';
COMMENT ON COLUMN public.users.preferred_entrance IS 'Preferred entrance for address delivery';
COMMENT ON COLUMN public.users.preferred_floor IS 'Preferred floor for address delivery';
COMMENT ON COLUMN public.users.preferred_apartment IS 'Preferred apartment for address delivery';
