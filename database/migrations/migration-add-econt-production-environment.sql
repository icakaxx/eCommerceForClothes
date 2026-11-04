-- Allow production Econt environment on shipments (run once in Supabase SQL Editor).

ALTER TABLE public.econt_shipments
  DROP CONSTRAINT IF EXISTS econt_shipments_environment_check;

ALTER TABLE public.econt_shipments
  ADD CONSTRAINT econt_shipments_environment_check
  CHECK (environment IN ('demo', 'production'));
