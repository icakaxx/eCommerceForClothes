-- Tracking dashboard 2.0 fields. Additive only. Run in Supabase SQL editor.
-- Does not rewrite existing shipment numbers or labels.

ALTER TABLE public.econt_shipments
  ADD COLUMN IF NOT EXISTS next_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_state text,
  ADD COLUMN IF NOT EXISTS financial_data_completeness text,
  ADD COLUMN IF NOT EXISTS reconciliation_status text,
  ADD COLUMN IF NOT EXISTS contact_state text,
  ADD COLUMN IF NOT EXISTS internal_cash_confirmed_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS internal_cash_confirmed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_econt_shipments_next_sync
  ON public.econt_shipments(next_sync_at)
  WHERE shipment_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.econt_shipment_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.econt_shipments(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  note text,
  performed_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_econt_shipment_actions_shipment
  ON public.econt_shipment_actions(shipment_id, created_at DESC);

ALTER TABLE public.econt_shipment_actions ENABLE ROW LEVEL SECURITY;
