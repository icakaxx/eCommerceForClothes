-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  last_login timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id),
  CONSTRAINT admin_users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.bulk_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_type USER-DEFINED NOT NULL,
  state USER-DEFINED NOT NULL DEFAULT 'queued'::bulk_job_state,
  payload jsonb NOT NULL,
  result jsonb,
  requested_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bulk_jobs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.campaign_changes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  scope USER-DEFINED NOT NULL,
  target_id uuid,
  change jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campaign_changes_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_changes_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.campaign_previews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  snapshot jsonb NOT NULL,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campaign_previews_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_previews_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.campaign_products (
  campaign_id uuid NOT NULL,
  product_id uuid NOT NULL,
  badge_text text,
  price_override numeric,
  CONSTRAINT campaign_products_pkey PRIMARY KEY (campaign_id, product_id),
  CONSTRAINT campaign_products_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id),
  CONSTRAINT campaign_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.campaign_tabs (
  campaign_id uuid NOT NULL,
  menu_item_id uuid NOT NULL,
  visibility USER-DEFINED NOT NULL DEFAULT 'during'::campaign_tab_visibility,
  CONSTRAINT campaign_tabs_pkey PRIMARY KEY (campaign_id, menu_item_id),
  CONSTRAINT campaign_tabs_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id),
  CONSTRAINT campaign_tabs_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id)
);
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::campaign_status,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  preview_token text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_id uuid,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);
CREATE TABLE public.collection_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL,
  rule jsonb NOT NULL,
  CONSTRAINT collection_rules_pkey PRIMARY KEY (id),
  CONSTRAINT collection_rules_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id)
);
CREATE TABLE public.collections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  badge_color text,
  is_automatic boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT collections_pkey PRIMARY KEY (id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text,
  segment text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.discount_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  discount_id uuid NOT NULL,
  order_id uuid,
  customer_id uuid,
  amount numeric NOT NULL DEFAULT 0,
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT discount_applications_pkey PRIMARY KEY (id),
  CONSTRAINT discount_applications_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discount_rules(id),
  CONSTRAINT discount_applications_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT discount_applications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.discount_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  discount_type USER-DEFINED NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  usage_limit integer,
  per_customer_limit integer,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT discount_rules_pkey PRIMARY KEY (id)
);
CREATE TABLE public.menu_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  menu_id uuid NOT NULL,
  parent_id uuid,
  label text NOT NULL,
  target_type USER-DEFINED NOT NULL,
  target_id uuid,
  href text,
  position integer NOT NULL DEFAULT 0,
  visibility USER-DEFINED NOT NULL DEFAULT 'always'::menu_visibility,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT menu_items_pkey PRIMARY KEY (id),
  CONSTRAINT menu_items_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id),
  CONSTRAINT menu_items_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.menu_items(id)
);
CREATE TABLE public.menus (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  device USER-DEFINED NOT NULL DEFAULT 'all'::menu_device,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT menus_pkey PRIMARY KEY (id)
);
CREATE TABLE public.metrics_daily (
  metric_date date NOT NULL,
  revenue numeric NOT NULL DEFAULT 0,
  orders_count integer NOT NULL DEFAULT 0,
  conversion_rate numeric NOT NULL DEFAULT 0,
  top_product_ids ARRAY NOT NULL DEFAULT ARRAY[]::uuid[],
  top_campaign_ids ARRAY NOT NULL DEFAULT ARRAY[]::uuid[],
  CONSTRAINT metrics_daily_pkey PRIMARY KEY (metric_date)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  variant_id uuid,
  qty integer NOT NULL CHECK (qty > 0),
  unit_price numeric NOT NULL DEFAULT 0,
  currency character NOT NULL DEFAULT 'USD'::bpchar,
  discount_amount numeric NOT NULL DEFAULT 0,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::order_status,
  total_amount numeric NOT NULL DEFAULT 0,
  currency character NOT NULL DEFAULT 'USD'::bpchar,
  campaign_id uuid,
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  billing_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  placed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.page_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL,
  section_type USER-DEFINED NOT NULL,
  data jsonb NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT page_sections_pkey PRIMARY KEY (id),
  CONSTRAINT page_sections_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id)
);
CREATE TABLE public.page_widgets (
  page_id uuid NOT NULL,
  widget_id uuid NOT NULL,
  position integer NOT NULL DEFAULT 0,
  CONSTRAINT page_widgets_pkey PRIMARY KEY (page_id, widget_id),
  CONSTRAINT page_widgets_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id),
  CONSTRAINT page_widgets_widget_id_fkey FOREIGN KEY (widget_id) REFERENCES public.widgets(id)
);
CREATE TABLE public.pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::page_status,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.product_categories (
  product_id uuid NOT NULL,
  category_id uuid NOT NULL,
  CONSTRAINT product_categories_pkey PRIMARY KEY (product_id, category_id),
  CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.product_collections (
  product_id uuid NOT NULL,
  collection_id uuid NOT NULL,
  position integer NOT NULL DEFAULT 0,
  CONSTRAINT product_collections_pkey PRIMARY KEY (product_id, collection_id),
  CONSTRAINT product_collections_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_collections_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id)
);
CREATE TABLE public.product_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  media_type USER-DEFINED NOT NULL DEFAULT 'image'::media_type,
  url text NOT NULL,
  alt text,
  position integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT product_media_pkey PRIMARY KEY (id),
  CONSTRAINT product_media_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  option_values jsonb NOT NULL,
  sku text UNIQUE,
  price_override numeric,
  inventory_qty integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::product_status,
  base_price numeric NOT NULL DEFAULT 0,
  currency character NOT NULL DEFAULT 'USD'::bpchar,
  sku text UNIQUE,
  inventory_policy USER-DEFINED NOT NULL DEFAULT 'deny'::inventory_policy,
  inventory_qty integer NOT NULL DEFAULT 0,
  tags ARRAY NOT NULL DEFAULT ARRAY[]::text[],
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.promotion_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  discount_id uuid,
  campaign_id uuid,
  asset_type USER-DEFINED NOT NULL,
  data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT promotion_assets_pkey PRIMARY KEY (id),
  CONSTRAINT promotion_assets_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discount_rules(id)
);
CREATE TABLE public.role_permissions (
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id),
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.theme_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  theme_id uuid NOT NULL,
  campaign_id uuid,
  is_default boolean NOT NULL DEFAULT false,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT theme_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT theme_assignments_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id),
  CONSTRAINT theme_assignments_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.theme_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  theme_id uuid NOT NULL,
  token_group USER-DEFINED NOT NULL,
  token_key text NOT NULL,
  token_value text NOT NULL,
  CONSTRAINT theme_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT theme_tokens_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id)
);
CREATE TABLE public.themes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT themes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_roles (
  admin_user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT user_roles_pkey PRIMARY KEY (admin_user_id, role_id),
  CONSTRAINT user_roles_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.admin_users(id),
  CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
CREATE TABLE public.widgets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  widget_type USER-DEFINED NOT NULL,
  data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT widgets_pkey PRIMARY KEY (id)
);