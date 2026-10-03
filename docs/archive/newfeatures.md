hey let s create a few more features in the admin panel:

You are working on an existing Next.js + Supabase project.

Important context:
This project already has an existing admin panel at /admin. The admin panel already includes sections such as:

- Dashboard / Табло
- Categories / Категории
- Characteristics / Характеристики
- Products / Артикули
- Inventory / Наличности
- Sales / Продажби
- Customers / Клиенти
- Reports / Доклади
- Visitors / Посетители
- Finances / Финанси
- Discounts / Отстъпки
- Media / Медия
- Store Settings / Настройки на магазина

The current admin dashboard already works and must not be broken.

The task is NOT to rebuild the whole app from scratch.

The task is to carefully extend and improve the existing /admin area so it can support an internal clothing inventory and order management workflow.

==================================================
CRITICAL RULES
==================================================

1. Do not affect any existing functionality outside the /admin area.
2. Do not break the existing admin navigation, layout, authentication, product logic, category logic, media logic, or sales logic.
3. Do not delete or rename existing database tables.
4. Do not modify existing columns unless absolutely necessary.
5. Do not introduce destructive migrations.
6. Before making changes, inspect the current codebase and Supabase/database schema.
7. First identify which tables already exist and what they are used for.
8. If existing tables can be reused safely, reuse them.
9. If new tables are needed, propose additive tables only.
10. If there is any conflict between the current schema and the new required schema, stop and explain the conflict before implementing.
11. If there is any risk of breaking existing functionality, stop and ask for confirmation.
12. Keep all changes incremental and reversible.
13. Make a clear implementation plan before writing code.

==================================================
FIRST STEP: AUDIT EXISTING PROJECT
==================================================

Before implementing anything, inspect the current project structure.

Check:

- app/admin routes
- admin layout components
- sidebar/navigation components
- existing product pages
- existing inventory/stock pages
- existing sales/order pages
- existing customer pages
- existing Supabase client setup
- existing database queries
- existing table names
- existing types
- existing storage/media logic
- existing authentication and route protection
- existing UI component system

Then inspect the current database schema or migration files.

Look for existing tables such as:

- products
- product_categories
- categories
- product_variants
- characteristics
- inventory
- stock
- sales
- orders
- customers
- media
- discounts
- finances
- visitors
- settings

After the audit, provide a short report:

1. Which existing tables were found.
2. Which tables can be reused.
3. Which tables should not be touched.
4. Which new tables are needed, if any.
5. Whether the new inventory/order workflow conflicts with current logic.
6. What files will be changed.
7. What files will not be touched.

Do not implement until this audit and plan are clear.

==================================================
GOAL
==================================================

Extend the existing /admin panel into a practical internal system for:

- registering incoming clothing stock;
- uploading product images during product/stock creation;
- managing stock by product, color, size, and series/batch;
- creating customer orders;
- checking available stock during order creation;
- showing non-blocking stock warnings;
- automatically decreasing stock when an order is saved;
- tracking sent orders;
- changing order statuses;
- adding optional notes on status changes;
- automatically returning stock when an order is marked as returned;
- supporting custom table views in the order tracking page;
- filtering, sorting, and financial summaries.

This must be added without breaking existing admin functionality.

==================================================
EXISTING ADMIN UI
==================================================

The current /admin dashboard has a sidebar and a dashboard layout.

Keep the same visual direction and layout structure.

Do not replace the whole admin panel.

Improve it carefully by adding or extending pages.

The system should remain in Bulgarian.

Use Bulgarian labels in the UI.

Examples:

- Наличности
- Заприхождаване
- Нова поръчка
- Изпратени поръчки
- Клиент
- Телефон
- Град
- Област
- Еконт офис
- Артикул
- Цвят
- Размер
- Серия
- Бройка
- Цена
- Обща сума
- Статус
- Бележка
- Върната
- Взета
- Изпратена
- Чака стока

==================================================
ADMIN NAVIGATION CHANGES
==================================================

Do not remove existing sidebar items.

If needed, extend the existing admin navigation with clearer sections.

Possible additions or improvements:

1. Наличности
   - Current stock overview
   - Stock by product/color/size/series
   - Low stock indicators
   - Negative stock indicators

2. Заприхождаване
   - Add new stock
   - Add product image
   - Add variants by color/size/series
   - Add quantities

3. Нова поръчка
   - Create customer order
   - Select product from dropdown
   - Select color, size, series
   - Show product image automatically
   - Show stock warnings

4. Изпратени поръчки
   - Track orders
   - Change status
   - Add optional status notes
   - Filter/sort/custom views
   - Financial summary

If the existing “Продажби” page already represents orders/sales, evaluate whether it should be extended instead of creating a duplicate page.

Do not duplicate functionality unnecessarily.

==================================================
DATABASE STRATEGY
==================================================

Do not blindly create new tables if similar tables already exist.

First inspect current schema.

If existing product tables exist, reuse them where safe.

If existing product image/media logic exists, reuse it where safe.

If existing sales/orders tables exist, evaluate whether they already support:

- customer details
- order items
- statuses
- notes
- stock movement
- returned order logic

If they do not, propose additive tables or additive columns.

Preferred approach:
Use additive migrations only.

Do not drop tables.
Do not rename tables.
Do not delete columns.
Do not change existing business logic without confirmation.

==================================================
RECOMMENDED TABLES IF MISSING
==================================================

If the existing schema does not already support this workflow, add only the missing tables.

Possible new tables:

1. product_variants
Tracks stock per product + color + size + series.

Fields:
- id uuid primary key
- product_id uuid references existing products table
- color text not null
- size text not null
- series text nullable
- quantity integer not null default 0
- created_at timestamptz default now()
- updated_at timestamptz default now()

2. stock_movements
Tracks every stock change.

Fields:
- id uuid primary key
- product_variant_id uuid references product_variants(id)
- movement_type text not null
- quantity_change integer not null
- reason text nullable
- related_order_id uuid nullable
- note text nullable
- created_by uuid nullable
- created_at timestamptz default now()

Movement types:
- stock_in
- order_created
- order_returned
- order_unreturned
- manual_adjustment

3. order_status_history
Tracks status changes and optional notes.

Fields:
- id uuid primary key
- order_id uuid references existing orders/sales table if available
- old_status text nullable
- new_status text not null
- note text nullable
- changed_by uuid nullable
- created_at timestamptz default now()

4. custom_views
Stores custom table views.

Fields:
- id uuid primary key
- user_id uuid references auth.users(id)
- name text not null
- table_key text not null
- visible_columns jsonb not null
- filters jsonb nullable
- sorting jsonb nullable
- is_default boolean default false
- created_at timestamptz default now()
- updated_at timestamptz default now()

Only create these if the existing database does not already have equivalent structures.

==================================================
PRODUCT IMAGE LOGIC
==================================================

When adding or editing a product / stock item, the admin user must be able to upload a product image.

Use the existing media/upload system if one already exists.

If the project already has a Media section, inspect it first.

Do not create a second conflicting media system if the existing one can be reused.

If no suitable upload system exists, use Supabase Storage.

Requirements:

- upload product image during product creation or stock registration;
- save image URL/path to the product record;
- display product image in inventory;
- display product image automatically when creating an order;
- do not upload product image manually during order creation;
- order item should use the existing product image.

==================================================
INVENTORY / НАЛИЧНОСТИ
==================================================

Extend the existing Наличности page or create it if it does not exist.

Features:

- show all stock by product;
- show product image;
- show product name/model;
- show color;
- show size;
- show series/batch;
- show quantity;
- show low stock warning;
- show negative stock warning;
- search;
- filters by product, model, color, size, series;
- add stock;
- edit stock;
- register incoming stock.

Stock states:

- quantity > 1: normal
- quantity = 1: low stock warning
- quantity = 0: out of stock warning
- quantity < 0: negative stock / oversold warning

Negative stock must be allowed.

==================================================
ЗАПРИХОЖДАВАНЕ / REGISTER STOCK
==================================================

Create or extend a page for registering incoming stock.

The admin should be able to:

- create a new product;
- upload product image;
- add product name;
- add model;
- add description if needed;
- add default price if needed;
- add multiple variants:
  - color
  - size
  - series/batch
  - quantity

Also allow adding stock to an existing product and existing variant.

When stock is added, create a stock movement record.

==================================================
CREATE ORDER / НОВА ПОРЪЧКА
==================================================

Create or extend an admin page for adding a new order.

Customer fields:

- full name
- phone
- city
- region, optional
- Econt office/name
- customer note, optional
- internal note, optional

Order item fields:

- product dropdown
- color dropdown
- size dropdown
- series dropdown, if applicable
- quantity
- unit price
- line total
- product image preview

Important:
The product image must come from the selected product.
Do not upload images during order creation.

Support multiple products in one order.

==================================================
STOCK WARNING LOGIC
==================================================

During order creation, check stock in real time.

Rules:

1. If enough stock exists:
   - no warning.

2. If only 1 item will remain after this order:
   - show a dismissible warning:
     “Внимание: след тази поръчка ще остане само 1 бройка от този артикул.”

3. If there is not enough stock:
   - show a dismissible warning:
     “Внимание: няма достатъчна наличност за този артикул/размер. Можеш да продължиш, ако очакваш доставка.”

4. If stock is 0 or negative:
   - show a dismissible warning:
     “Внимание: този артикул в момента няма наличност. Можеш да продължиш, ако очакваш доставка.”

Warnings must:

- not block the user;
- be closable with X;
- allow the order to be saved;
- allow stock to become negative.

==================================================
ORDER SAVE LOGIC
==================================================

When an order is saved:

- create or reuse customer if customer table exists;
- create order/sale record;
- create order items;
- calculate total amount;
- decrease stock for each selected product variant;
- create stock movement records;
- create status history record;
- show success message.

Important:
Critical stock updates must happen server-side.

Do not rely only on client-side stock changes.

Use a server action, API route, or Supabase RPC/database function.

If possible, use a transaction-like approach to avoid partial updates.

==================================================
ORDER TRACKING / ИЗПРАТЕНИ ПОРЪЧКИ
==================================================

Create or extend the existing sales/orders page into a tracking page.

The admin should see:

- date
- customer
- phone
- city
- region
- Econt office
- product image
- product name
- color
- size
- series
- quantity
- unit price
- total amount
- status
- notes
- last update

Statuses:

- new / Нова
- prepared / Подготвена
- sent / Изпратена
- picked_up / Взета
- returned / Върната
- cancelled / Отказана
- waiting_for_stock / Чака стока

Allow changing status from the table or order details page.

When changing status, allow optional note.

Save status changes in status history.

==================================================
RETURNED ORDER STOCK LOGIC
==================================================

When order status changes to returned / Върната:

- add the ordered quantities back to stock;
- create stock movement records;
- do this only once per returned transition.

Rules:

1. On order creation:
   - subtract stock.

2. From non-returned status to returned:
   - add stock back.

3. If already returned and saved again as returned:
   - do not add stock again.

4. From returned back to an active status:
   - subtract stock again.

This is critical. Prevent double stock addition.

==================================================
CUSTOM VIEWS IN ORDER TRACKING
==================================================

In the order tracking page, implement custom table views.

The admin should be able to:

- choose visible columns;
- hide/show columns;
- sort columns;
- filter orders;
- save a custom view;
- load saved views;
- reset to default view.

Suggested views:

- Всички поръчки
- Само изпратени
- Само върнати
- Само взети
- Чакащи стока
- Финансов изглед
- По артикули
- По клиенти

If a custom view system already exists, reuse it.

If not, add it without breaking current pages.

==================================================
FILTERS AND SORTING
==================================================

Orders tracking filters:

- status
- date range
- product
- model
- color
- size
- series
- customer name
- phone
- city
- returned only
- picked up only
- waiting for stock only

Sorting:

- newest first
- oldest first
- customer
- city
- total amount
- status
- last updated

==================================================
FINANCIAL SUMMARY
==================================================

Add summary cards to the orders tracking page.

The summary must respect active filters.

Show:

- total amount of visible orders;
- total amount of picked up orders;
- total amount of returned orders;
- number of orders;
- number of sent orders;
- number of picked up orders;
- number of returned orders;
- number of waiting for stock orders;
- total number of sold items.

==================================================
MOBILE OPTIMIZATION
==================================================

The /admin panel must be optimized for mobile.

Important:

- do not break desktop sidebar layout;
- make forms easy on phone;
- make order creation fast on phone;
- product dropdowns must be usable;
- warnings must be visible and closable;
- tables should become cards or scrollable tables on mobile;
- buttons must be large enough;
- product images must display properly;
- avoid overcrowded screens.

==================================================
DO NOT BREAK EXISTING FUNCTIONALITY
==================================================

Before editing, identify existing behavior.

Do not break:

- existing dashboard cards;
- existing categories;
- existing characteristics;
- existing products;
- existing inventory;
- existing sales;
- existing customers;
- existing reports;
- existing media;
- existing settings;
- existing auth;
- existing routing;
- existing Supabase queries.

If you need to change existing shared components, explain why.

Prefer adding new components instead of rewriting existing ones.

==================================================
OUTPUT REQUIRED BEFORE IMPLEMENTATION
==================================================

Before implementing, output:

1. Current admin structure found.
2. Current database tables found.
3. Which existing tables will be reused.
4. Which new tables/columns are needed.
5. Potential conflicts or risks.
6. Exact files planned for modification.
7. Exact files that will not be touched.
8. Step-by-step implementation plan.

If there are schema conflicts, stop and ask for confirmation.

==================================================
IMPLEMENTATION ORDER
==================================================

After the audit and plan are accepted, implement in this order:

1. Add safe database migrations, additive only.
2. Add or extend inventory variant logic.
3. Add product image upload if not already available.
4. Extend stock registration.
5. Add order creation with stock warnings.
6. Add server-side stock decrease on order save.
7. Extend order tracking page.
8. Add status change with optional notes.
9. Add returned order stock restoration logic.
10. Add custom table views.
11. Add filters and summaries.
12. Optimize mobile layout.
13. Test all flows.

==================================================
TESTING CHECKLIST
==================================================

Test:

1. Existing admin dashboard still works.
2. Existing categories still work.
3. Existing products still work.
4. Existing media section still works.
5. Existing sales/customers pages still work.
6. Add product with image.
7. Add product variants by color/size/series.
8. Add stock.
9. Create order with enough stock.
10. Confirm stock decreases.
11. Create order with low stock.
12. Confirm warning appears.
13. Close warning with X.
14. Create order with 0 stock.
15. Confirm warning appears but order can be saved.
16. Confirm stock can become negative.
17. Mark order as returned.
18. Confirm stock is added back.
19. Save returned order again.
20. Confirm stock is not added twice.
21. Change returned order back to sent.
22. Confirm stock decreases again.
23. Add optional status note.
24. Confirm status history is saved.
25. Filter orders.
26. Sort orders.
27. Save custom view.
28. Reload page and confirm view persists.
29. Test on mobile.
30. Build successfully on Vercel.

Final goal:
Carefully upgrade the existing /admin panel into a practical internal clothing stock and order management system, without breaking any current functionality.

IMPORTANT: This is an existing working project. Do not rewrite the app. Do not rebuild the admin panel from scratch. First inspect the current code and database structure. Only make incremental, safe changes. If you find conflicts between the current database tables and the new requirements, stop and report them before changing anything.