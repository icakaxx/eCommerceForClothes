-- Supabase schema for ModaBox admin capabilities
-- Run this script inside the Supabase SQL editor.

create extension if not exists "pgcrypto";

---------------------------------------------------------------------------------------------------
-- Helper function for updated_at management
---------------------------------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

---------------------------------------------------------------------------------------------------
-- Custom enums
---------------------------------------------------------------------------------------------------
create type order_status as enum ('pending','paid','fulfilled','cancelled','refunded');
create type product_status as enum ('draft','active','hidden');
create type inventory_policy as enum ('deny','continue','backorder');
create type media_type as enum ('image','video');
create type menu_target_type as enum ('category','collection','page','url','event','product');
create type menu_visibility as enum ('always','campaign_only');
create type menu_device as enum ('desktop','mobile','footer','all');
create type page_status as enum ('draft','published','archived');
create type page_section_type as enum ('hero','grid','banner','video','rich_text','custom_html');
create type widget_type as enum ('hero','grid','banner','video','rich_text','custom_html','cta');
create type discount_type as enum ('percentage','fixed_amount','free_shipping');
create type promotion_asset_type as enum ('banner','landing','tab_badge','popup');
create type campaign_status as enum ('draft','active','upcoming','ended');
create type campaign_change_scope as enum ('menu','page','product','collection','theme');
create type campaign_tab_visibility as enum ('during','preview_only');
create type theme_token_group as enum ('color','typography','layout','spacing');
create type bulk_job_type as enum ('hide_products','price_adjustment','assign_collection','remove_collection','inventory_update');
create type bulk_job_state as enum ('queued','running','completed','failed');

---------------------------------------------------------------------------------------------------
-- Core commerce tables
---------------------------------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  phone text,
  segment text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_customers_updated
before update on public.customers
for each row execute function public.set_updated_at();

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  status order_status not null default 'pending',
  total_amount numeric(12,2) not null default 0,
  currency char(3) not null default 'USD',
  campaign_id uuid,
  shipping_address jsonb not null default '{}'::jsonb,
  billing_address jsonb not null default '{}'::jsonb,
  notes text,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_orders_updated
before update on public.orders
for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null,
  variant_id uuid,
  qty integer not null check (qty > 0),
  unit_price numeric(12,2) not null default 0,
  currency char(3) not null default 'USD',
  discount_amount numeric(12,2) not null default 0
);
create index order_items_order_id_idx on public.order_items(order_id);

create table public.metrics_daily (
  metric_date date primary key,
  revenue numeric(14,2) not null default 0,
  orders_count integer not null default 0,
  conversion_rate numeric(7,4) not null default 0,
  top_product_ids uuid[] not null default array[]::uuid[],
  top_campaign_ids uuid[] not null default array[]::uuid[]
);

---------------------------------------------------------------------------------------------------
-- Catalog: products, categories, collections
---------------------------------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  status product_status not null default 'draft',
  base_price numeric(12,2) not null default 0,
  currency char(3) not null default 'USD',
  sku text unique,
  inventory_policy inventory_policy not null default 'deny',
  inventory_qty integer not null default 0,
  tags text[] not null default array[]::text[],
  seo jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_products_updated
before update on public.products
for each row execute function public.set_updated_at();

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  media_type media_type not null default 'image',
  url text not null,
  alt text,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);
create index product_media_product_id_idx on public.product_media(product_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  option_values jsonb not null,
  sku text unique,
  price_override numeric(12,2),
  inventory_qty integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);
create index product_variants_product_id_idx on public.product_variants(product_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  slug text not null unique,
  title text not null,
  description text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_categories_updated
before update on public.categories
for each row execute function public.set_updated_at();

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  badge_color text,
  is_automatic boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_collections_updated
before update on public.collections
for each row execute function public.set_updated_at();

create table public.collection_rules (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  rule jsonb not null
);

create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create table public.product_collections (
  product_id uuid not null references public.products(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  position integer not null default 0,
  primary key (product_id, collection_id)
);

create table public.bulk_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type bulk_job_type not null,
  state bulk_job_state not null default 'queued',
  payload jsonb not null,
  result jsonb,
  requested_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_bulk_jobs_updated
before update on public.bulk_jobs
for each row execute function public.set_updated_at();

---------------------------------------------------------------------------------------------------
-- Navigation, pages, widgets
---------------------------------------------------------------------------------------------------
create table public.menus (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  device menu_device not null default 'all',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_menus_updated
before update on public.menus
for each row execute function public.set_updated_at();

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  parent_id uuid references public.menu_items(id) on delete cascade,
  label text not null,
  target_type menu_target_type not null,
  target_id uuid,
  href text,
  position integer not null default 0,
  visibility menu_visibility not null default 'always',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index menu_items_menu_id_idx on public.menu_items(menu_id);
create trigger trg_menu_items_updated
before update on public.menu_items
for each row execute function public.set_updated_at();

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  status page_status not null default 'draft',
  meta jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_pages_updated
before update on public.pages
for each row execute function public.set_updated_at();

create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  section_type page_section_type not null,
  data jsonb not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index page_sections_page_id_idx on public.page_sections(page_id);
create trigger trg_page_sections_updated
before update on public.page_sections
for each row execute function public.set_updated_at();

create table public.widgets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  widget_type widget_type not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_widgets_updated
before update on public.widgets
for each row execute function public.set_updated_at();

create table public.page_widgets (
  page_id uuid not null references public.pages(id) on delete cascade,
  widget_id uuid not null references public.widgets(id) on delete cascade,
  position integer not null default 0,
  primary key (page_id, widget_id)
);

---------------------------------------------------------------------------------------------------
-- Marketing, discounts, promotions
---------------------------------------------------------------------------------------------------
create table public.discount_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  discount_type discount_type not null,
  value numeric(12,2) not null default 0,
  usage_limit integer,
  per_customer_limit integer,
  starts_at timestamptz,
  ends_at timestamptz,
  conditions jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_discount_rules_updated
before update on public.discount_rules
for each row execute function public.set_updated_at();

create table public.discount_applications (
  id uuid primary key default gen_random_uuid(),
  discount_id uuid not null references public.discount_rules(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  amount numeric(12,2) not null default 0,
  applied_at timestamptz not null default now()
);

create table public.promotion_assets (
  id uuid primary key default gen_random_uuid(),
  discount_id uuid references public.discount_rules(id) on delete cascade,
  campaign_id uuid,
  asset_type promotion_asset_type not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_promotion_assets_updated
before update on public.promotion_assets
for each row execute function public.set_updated_at();

---------------------------------------------------------------------------------------------------
-- Campaigns / content staging
---------------------------------------------------------------------------------------------------
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  status campaign_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  preview_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_campaigns_updated
before update on public.campaigns
for each row execute function public.set_updated_at();

create table public.campaign_changes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  scope campaign_change_scope not null,
  target_id uuid,
  change jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index campaign_changes_campaign_id_idx on public.campaign_changes(campaign_id);
create trigger trg_campaign_changes_updated
before update on public.campaign_changes
for each row execute function public.set_updated_at();

create table public.campaign_tabs (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  visibility campaign_tab_visibility not null default 'during',
  primary key (campaign_id, menu_item_id)
);

create table public.campaign_products (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  badge_text text,
  price_override numeric(12,2),
  primary key (campaign_id, product_id)
);

create table public.campaign_previews (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  snapshot jsonb not null,
  generated_at timestamptz not null default now()
);

---------------------------------------------------------------------------------------------------
-- Themes and assignments
---------------------------------------------------------------------------------------------------
create table public.themes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_themes_updated
before update on public.themes
for each row execute function public.set_updated_at();

create table public.theme_tokens (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.themes(id) on delete cascade,
  token_group theme_token_group not null,
  token_key text not null,
  token_value text not null,
  unique(theme_id, token_group, token_key)
);

create table public.theme_assignments (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.themes(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  is_default boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  check ((is_default and campaign_id is null) or not is_default),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_theme_assignments_updated
before update on public.theme_assignments
for each row execute function public.set_updated_at();

---------------------------------------------------------------------------------------------------
-- Admin users / permissions
---------------------------------------------------------------------------------------------------
create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  status text not null default 'active',
  last_login timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_admin_users_updated
before update on public.admin_users
for each row execute function public.set_updated_at();

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_roles_updated
before update on public.roles
for each row execute function public.set_updated_at();

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_permissions_updated
before update on public.permissions
for each row execute function public.set_updated_at();

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.user_roles (
  admin_user_id uuid not null references public.admin_users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  scope jsonb not null default '{}'::jsonb,
  primary key (admin_user_id, role_id)
);

---------------------------------------------------------------------------------------------------
-- Supporting indexes
---------------------------------------------------------------------------------------------------
create index products_status_idx on public.products(status);
create index products_campaign_idx on public.product_collections(collection_id);
create index collections_auto_idx on public.collections(is_automatic);
create index discount_rules_active_idx on public.discount_rules(starts_at, ends_at);
create index campaigns_window_idx on public.campaigns(starts_at, ends_at);
create index theme_assignments_window_idx on public.theme_assignments(starts_at, ends_at);


