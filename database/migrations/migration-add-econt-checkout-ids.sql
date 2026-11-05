-- Backward-compatible Econt identifiers for checkout-created orders.
-- Does not rewrite historical rows. Existing free-text orders.econtoffice stays intact.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS econt_city_id integer;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS econt_office_code text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS econt_office_name text;

COMMENT ON COLUMN public.orders.econt_city_id IS 'Official Econt city ID from NomenclaturesService.getCities';
COMMENT ON COLUMN public.orders.econt_office_code IS 'Official Econt office code from NomenclaturesService.getOffices';
COMMENT ON COLUMN public.orders.econt_office_name IS 'Official Econt office name for display';
