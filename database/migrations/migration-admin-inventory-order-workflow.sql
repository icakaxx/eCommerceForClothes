-- Additive migration: internal inventory / order workflow (admin).
-- Run once on Supabase. Does not drop or rename existing objects.

-- Stock ledger (optional audit trail; safe if unused by older code paths)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  productvariantid uuid NOT NULL REFERENCES public.product_variants(productvariantid) ON DELETE CASCADE,
  movement_type text NOT NULL,
  quantity_change integer NOT NULL,
  reason text,
  related_order_id text,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_variant
  ON public.stock_movements(productvariantid);
CREATE INDEX IF NOT EXISTS idx_stock_movements_order
  ON public.stock_movements(related_order_id);

COMMENT ON TABLE public.stock_movements IS 'Audit log for stock changes (stock_in, order_created, order_returned, etc.)';

-- Status change history with optional note
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.orders(orderid) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  note text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order
  ON public.order_status_history(order_id);

-- Saved table layouts for order tracking (per admin user)
CREATE TABLE IF NOT EXISTS public.admin_order_tracking_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  table_key text NOT NULL DEFAULT 'order_tracking',
  visible_columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  filters jsonb,
  sorting jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_order_tracking_views_user_name_key UNIQUE (user_id, name, table_key)
);

CREATE INDEX IF NOT EXISTS idx_admin_order_tracking_views_user
  ON public.admin_order_tracking_views(user_id, table_key);

-- Orders: notes, region, idempotent return stock handling
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_order_note text,
  ADD COLUMN IF NOT EXISTS internal_note text,
  ADD COLUMN IF NOT EXISTS delivery_region text,
  ADD COLUMN IF NOT EXISTS return_stock_applied boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.orders.return_stock_applied IS 'When true, stock was credited for returned status; prevents double credit.';
