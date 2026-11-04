-- Econt Demo shipping integration (additive). Run once in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.econt_sender_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  email text,
  country_code text NOT NULL DEFAULT 'BGR',
  city_id integer,
  city_name text NOT NULL DEFAULT 'Ловеч',
  office_code text NOT NULL,
  office_name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_econt_sender_profiles_active
  ON public.econt_sender_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_econt_sender_profiles_default
  ON public.econt_sender_profiles(is_default) WHERE is_default = true;

COMMENT ON TABLE public.econt_sender_profiles IS 'Saved Econt sender (individual) profiles for label creation';

CREATE TABLE IF NOT EXISTS public.econt_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.orders(orderid) ON DELETE CASCADE,
  environment text NOT NULL DEFAULT 'demo' CHECK (environment IN ('demo')),
  sender_profile_id uuid REFERENCES public.econt_sender_profiles(id) ON DELETE SET NULL,
  shipment_number text,
  sender_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  receiver_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  draft_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  shipment_type text NOT NULL DEFAULT 'pack',
  package_count integer NOT NULL DEFAULT 1 CHECK (package_count >= 1),
  weight numeric(10,3) CHECK (weight IS NULL OR weight > 0),
  description text NOT NULL DEFAULT 'Дреха',
  delivery_type text NOT NULL,
  delivery_payer text NOT NULL DEFAULT 'receiver',
  expected_cod_amount numeric(12,2) CHECK (expected_cod_amount IS NULL OR expected_cod_amount >= 0),
  computed_cod_amount numeric(12,2) CHECK (computed_cod_amount IS NULL OR computed_cod_amount >= 0),
  cod_override_amount numeric(12,2) CHECK (cod_override_amount IS NULL OR cod_override_amount >= 0),
  cod_currency text NOT NULL DEFAULT 'EUR',
  validation_state text NOT NULL DEFAULT 'none',
  creation_state text NOT NULL DEFAULT 'draft',
  validation_hash text,
  validation_expires_at timestamptz,
  last_validated_at timestamptz,
  normalized_delivery_status text NOT NULL DEFAULT 'prepared',
  raw_delivery_status text,
  collected_cod_amount numeric(12,2),
  collected_cod_currency text,
  collected_cod_at timestamptz,
  paid_cod_amount numeric(12,2),
  paid_cod_currency text,
  paid_cod_at timestamptz,
  merchant_delivery_cost numeric(12,2),
  total_price numeric(12,2),
  sender_due_amount numeric(12,2),
  receiver_due_amount numeric(12,2),
  financial_discrepancy jsonb,
  returned_at timestamptz,
  return_shipment_number text,
  label_pdf_url text,
  last_sync_at timestamptz,
  last_sync_attempt_at timestamptz,
  last_sync_error text,
  diagnostics jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_econt_shipments_shipment_number
  ON public.econt_shipments(shipment_number) WHERE shipment_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_econt_shipments_order
  ON public.econt_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_econt_shipments_status
  ON public.econt_shipments(normalized_delivery_status);
CREATE INDEX IF NOT EXISTS idx_econt_shipments_creation_state
  ON public.econt_shipments(creation_state);

-- One active non-failed shipment per order in demo
CREATE UNIQUE INDEX IF NOT EXISTS idx_econt_shipments_active_order
  ON public.econt_shipments(order_id, environment)
  WHERE creation_state NOT IN ('failed', 'cancelled');

COMMENT ON TABLE public.econt_shipments IS 'Econt shipping labels linked to orders';

CREATE TABLE IF NOT EXISTS public.econt_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.econt_shipments(id) ON DELETE CASCADE,
  source_event_key text NOT NULL,
  event_time timestamptz,
  event_type text,
  description text,
  city text,
  office text,
  original_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT econt_tracking_events_shipment_key UNIQUE (shipment_id, source_event_key)
);

CREATE INDEX IF NOT EXISTS idx_econt_tracking_events_shipment
  ON public.econt_tracking_events(shipment_id, event_time DESC);

CREATE TABLE IF NOT EXISTS public.econt_payment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES public.econt_shipments(id) ON DELETE SET NULL,
  shipment_number text NOT NULL,
  source_type text NOT NULL DEFAULT 'payment_report',
  payment_type text,
  payout_method text,
  paid_amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  paid_at timestamptz,
  source_document_created_at timestamptz,
  raw_report_data jsonb,
  imported_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT econt_payment_reports_dedupe UNIQUE (
    shipment_number, source_type, payment_type, paid_amount, currency, paid_at
  )
);

CREATE INDEX IF NOT EXISTS idx_econt_payment_reports_shipment
  ON public.econt_payment_reports(shipment_id);

CREATE TABLE IF NOT EXISTS public.econt_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL,
  environment text NOT NULL DEFAULT 'demo',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  processed_count integer NOT NULL DEFAULT 0,
  success_count integer NOT NULL DEFAULT 0,
  failure_count integer NOT NULL DEFAULT 0,
  error_summary text
);

CREATE TABLE IF NOT EXISTS public.econt_shipment_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES public.econt_shipments(id) ON DELETE SET NULL,
  order_id text,
  admin_identifier text,
  operation text NOT NULL,
  result text NOT NULL,
  safe_error_code text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_econt_shipment_audit_shipment
  ON public.econt_shipment_audit_logs(shipment_id, created_at DESC);
