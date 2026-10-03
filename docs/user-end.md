# MODABOX — User-end reference

Everything a shopper can reach on the public site (excluding `/admin/*`).

**Layout zones used below:**
- **Top bar** — `Banner` (promo strip)
- **Header** — sticky nav (logo, menu, icons)
- **Page body** — main content
- **Footer** — links & contact
- **Overlay** — modals, drawers, banners on top of the page

---

## Pages (14 routes)

| # | URL | Purpose (BG / EN) | Source file |
|---|-----|-------------------|-------------|
| 1 | `/` | Homepage | `app/page.tsx` |
| 2 | `/for-him` | Store — “За него” | `app/for-him/page.tsx` |
| 3 | `/for-her` | Store — “За нея” | `app/for-her/page.tsx` |
| 4 | `/accessories` | Accessories | `app/accessories/page.tsx` |
| 5 | `/products` | All products | `app/products/page.tsx` |
| 6 | `/products/[id]` | Product detail | `app/products/[id]/page.tsx` |
| 7 | `/[category]` | Dynamic category listing | `app/[category]/page.tsx` |
| 8 | `/about` | About us — “За нас” | `app/about/page.tsx` |
| 9 | `/checkout` | Checkout — “Поръчка” | `app/checkout/page.tsx` |
| 10 | `/checkout/success` | Order confirmation | `app/checkout/success/page.tsx` |
| 11 | `/user` | Login & register | `app/user/page.tsx` |
| 12 | `/user/dashboard` | Account dashboard | `app/user/dashboard/page.tsx` |
| 13 | `/user/forgot-password` | Forgot password | `app/user/forgot-password/page.tsx` |
| 14 | `/user/reset-password` | Reset password | `app/user/reset-password/page.tsx` |

---

## Global shell (on most shop pages)

Present via `PublicPageLayout` on shop/about/checkout pages. User auth pages include Header + Footer + CartDrawer manually.

### Top bar — `Banner.tsx`

| Placement | Element | Label (BG) | Action |
|-----------|---------|------------|--------|
| Left | Promo text + truck icon | Rotating banner text from store settings | Info only (auto-rotates) |
| Right (desktop) | Link | За нас | → `/about` |
| Right (desktop) | Link | Помощ | → `/about` |
| Right (desktop) | Link | Контакти | → `/about` |

### Header — `Header.tsx` (sticky)

| Placement | Element | Label / icon | Action |
|-----------|---------|--------------|--------|
| Left (mobile) | Icon button | ☰ Menu | Opens mobile menu drawer |
| Left / center | Logo + store name | MODABOX | → `/` |
| Center (desktop) | Nav links | ЗА НЕГО / ЗА НЕЯ / АКСЕСОАРИ | → section pages; hover opens mega-menu |
| Mega-menu (desktop) | Category buttons | Category names | Filter products by category |
| Mega-menu (desktop) | Subcategory buttons | Subcategory names | Navigate to filtered listing |
| Mega-menu (desktop) | Product image panel | Preview image | Visual only |
| Right (desktop) | Icon link | 🔍 Search | → `/products` |
| Right | Icon button | 🛒 Cart (+ badge count) | Opens cart drawer |
| Right | Icon link | 👤 Profile / Login | → `/user/dashboard` or `/user` |
| Right (if logged in) | Icon button | Logout | Logs out → `/` |
| Right (if admin preview) | Icon buttons | Settings / Exit admin | → `/admin` or exit preview |

### Footer — `Footer.tsx`

| Placement | Element | Label (BG) | Action |
|-----------|---------|------------|--------|
| Col 1 | Logo link | Store logo / name | → `/` |
| Col 2 | Links | За него, За нея, Аксесоари | → store sections |
| Col 3 | Links | Phone, Email | `tel:` / `mailto:` |
| Center | Icon link | TikTok | Opens TikTok (external) |
| Bottom left | Text | Copyright | Info only |
| Bottom right | Link | H&M WsPro | → hmwspro.com |

### Site-wide overlay — `CookieConsentBanner.tsx`

| Placement | Element | Label (BG) | Action |
|-----------|---------|------------|--------|
| Bottom fixed | Banner | Cookie message | Info |
| Bottom | Button | Reject | Rejects cookies |
| Bottom | Button | Accept | Accepts cookies |
| Full screen dim | Backdrop click | — | Same as reject |

---

## Shared components (appear on multiple pages)

### Product card — `ProductCard.tsx`

Used on homepage, store pages, favorites, dashboard.

| Placement on card | Element | Label (BG) | Action |
|-------------------|---------|------------|--------|
| Image area | Prev/next arrows (hover) | ‹ › | Cycle product images |
| Top-right on image | Heart button | — | Add/remove favorite (opens login modal if guest) |
| Bottom-left on image | Badge | Нов модел | Info (featured products) |
| Card click (anywhere else) | — | — | → `/products/[id]` |
| Bottom of card | Button | Бързо добавяне (desktop text) / cart icon (mobile) | Opens **Add to cart modal** |

### Category pills — `CategoryPillsNav.tsx`

Homepage + store pages, horizontal scroll row.

| Pills | → URL |
|-------|-------|
| Всички | `/` |
| За него | `/for-him` |
| За нея | `/for-her` |
| Аксесоари | `/accessories` |
| Всички продукти | `/products` |

### Trust bar — `TrustBar.tsx`

Store pages only. Four info columns (no buttons): Бърза доставка, Лесно връщане, Сигурно плащане, Клиентска грижа.

---

## Page-by-page: functionality & buttons

### 1. `/` — Homepage

**Functionality:** Hero CTA, trust messaging, category navigation, featured product grid with pagination, optional favorites section (logged-in), CTA block, testimonials carousel, closing remarks from settings.

| Section | Placement | Buttons / links | Action |
|---------|-----------|-----------------|--------|
| Hero | Left overlay on image | Пазарувайте сега | → `/products` |
| Below hero | Row: pills + filter (desktop) | Филтри | → `/products` |
| Below hero | Full width (mobile) | Филтри | → `/products` |
| Product grid | Each card | See Product card above | — |
| Product grid | Center below grid | Вижте повече продукти | Loads 4 more products |
| Favorites (logged in) | Section header right | Виж всички | → `/user/dashboard?tab=favorites` |
| Bottom CTA | Center | View Products / Виж продуктите | → `/products` |
| Testimonials | Carousel | Prev/next (if multiple) | Cycle testimonials |

---

### 2–5, 7. Store pages — `/for-him`, `/for-her`, `/accessories`, `/products`, `/[category]`

All use `StorePage.tsx`.

**Functionality:** Filter products by category pills, property filters, URL category param; breadcrumb when filtered; 2-col mobile / 4-col desktop product grid.

| Section | Placement | Buttons / links | Action |
|---------|-----------|-----------------|--------|
| Trust bar | Top | — | Info only |
| Breadcrumb | Below title (when filtered) | Section / category names | Navigate up category tree |
| Title area | — | — | Info only |
| Category pills | Below title | Pill links | Change section |
| Filters | Right of pills (desktop) | Филтри (+ count badge) | Opens **Filter drawer** |
| Filters | Full width below pills (mobile) | Филтри (+ count badge) | Opens **Filter drawer** |
| Grid | Each card | See Product card | — |

---

### 6. `/products/[id]` — Product detail

**Functionality:** Full product info, image gallery with zoom, variant/size selection, stock status, favorites, share, add to cart, same-size alternatives when OOS, related products.

| Section | Placement | Buttons / links | Action |
|---------|-----------|-----------------|--------|
| Top | Left | ← Back link | → `/` |
| Title row | Right | Share icon | Native share or copy link |
| Title row | Right | Heart icon | Toggle favorite (login modal if guest) |
| Gallery (desktop) | Image click | — | Opens **image fullscreen modal** |
| Gallery | Slider arrows/dots | — | Change image |
| Options | Variant buttons grid | Size / color / etc. | Select variant |
| Stock box | — | — | Shows in stock / low / out |
| Bottom | Full width | Добави в количката | Adds to cart + opens cart drawer |
| OOS alternatives | Grid | Product cards | → other products |

---

### 8. `/about` — About us

**Functionality:** Store story, values icons, content from `aboutustext` in settings. No primary action buttons — read-only content page with global Header/Footer.

---

### 9. `/checkout` — Checkout

**Functionality:** Customer form, discount codes, delivery type selection, address/office fields, order summary, stock validation, place order.

| Section | Placement | Buttons / controls | Action |
|---------|-----------|---------------------|--------|
| Left card — discount | Next to code input | Приложи | Validates & applies discount |
| Left card — discount | Under applied code | Remove discount link | Removes discount |
| Left card — delivery | Radio cards | Офис / Адрес / Еконтомат | Select delivery type |
| Left card — city | Dropdown / search | City list items | Select city |
| Left card — office | Text input | — | Enter Econt office name |
| Left card — address | Inputs | Street, number, etc. | Enter address |
| Right card — summary | Bottom full width | Направи поръчка | Submit order → `/checkout/success` |

**Form fields (no separate buttons):** Бележки, Име*, Фамилия*, Телефон*, Имейл, Държава*, Град*.

---

### 10. `/checkout/success` — Order confirmation

**Functionality:** Shows order number, items, totals, delivery timeline steps, contact option.

| Section | Placement | Buttons / links | Action |
|---------|-----------|-----------------|--------|
| Error state | Center | Return to Home | → `/` |
| Actions row | Bottom | Продължи пазаруването | → `/` |
| Actions row | Bottom | Свържи се с нас | `mailto:` store email |

---

### 11. `/user` — Login & register

**Functionality:** Animated dual-panel login/register forms, email validation, redirect to dashboard or `returnUrl` after login.

| Section | Placement | Buttons / links | Action |
|---------|-----------|-----------------|--------|
| Login form | Password field | Eye icon | Show/hide password |
| Login form | Bottom | Submit — Вход | Log in |
| Login form | Below | Register link | Switch to register panel |
| Login form | Below | Forgot password link | → `/user/forgot-password` |
| Register form | Password field | Eye icon | Show/hide password |
| Register form | Bottom | Submit — Register | Create account |
| Register form | Below | Login link | Switch to login panel |

---

### 12. `/user/dashboard` — Account

**Functionality:** Three tabs — Orders, Profile, Favorites. Edit profile, delivery preferences, change password, view order details.

| Section | Placement | Buttons / links | Action |
|---------|-----------|-----------------|--------|
| Header | Top right | Изход | Log out |
| Tabs | Below header | Поръчки / Профил / Любими | Switch tab |
| Orders tab | Section header | Refresh icon | Reload orders |
| Orders tab | Each order card (click) | — | Opens **Order details modal** |
| Orders tab | Empty state | Shop products | → `/products` |
| Profile tab | Section header | Редактирай | Enable profile edit form |
| Profile edit | Bottom | Отказ / Запази промените | Cancel / save profile |
| Delivery prefs | Section header | Редактирай | Enable delivery form |
| Delivery edit | City dropdown | City options | Select city |
| Delivery edit | Bottom | Cancel / Save | Cancel / save preferences |
| Password section | Bottom | Промени парола | Submit password change |
| Favorites tab | Grid | Product cards | Same as Product card |
| Order modal | Top right | X | Close modal |
| Order modal | Bottom | Close button | Close modal |

---

### 13. `/user/forgot-password`

**Functionality:** Send reset link to email.

| Placement | Button | Action |
|-----------|--------|--------|
| Form bottom | Send reset link / Изпращам... | Email reset link |
| Below form | Login link | → `/user` |

---

### 14. `/user/reset-password`

**Functionality:** Set new password from email token (same layout pattern as forgot-password).

| Placement | Button | Action |
|-----------|--------|--------|
| Form bottom | Reset password submit | Update password |
| Below form | Login link | → `/user` |

---

## Modals, drawers & overlays

### 1. Add to cart — “Бързо добавяне” (`AddToCartModal.tsx`)

**Opened from:** Product card → Бързо добавяне  
**Functionality:** Pick required options (size etc.), quantity, preview price, add to cart.

| Zone | Placement | Buttons / controls | Action |
|------|-----------|-------------------|--------|
| Header | Top right | X | Close modal |
| Header | Left | Product thumbnail + title | Info |
| Body | Option grid | Size/option buttons (3-col) | Select variant |
| Body | Quantity row | − / input / + | Change quantity |
| Body | Price box | — | Shows line total |
| Footer | Left | Отказ | Close |
| Footer | Right | Добави в количката | Add to cart + open cart drawer |
| Backdrop | Click outside | — | Close |

---

### 2. Quick login (`QuickLoginModal.tsx`)

**Opened from:** Heart on product card or product detail (when not logged in)

| Zone | Placement | Buttons / controls | Action |
|------|-----------|-------------------|--------|
| Top right | X | Close |
| Form | Eye on password | Show/hide password |
| Form bottom | Вход | Log in + retry favorite |
| Bottom link | Register text | → `/user` |
| Backdrop | Click | Close |

---

### 3. Cart drawer — “Количка” (`CartDrawer.tsx`)

**Opened from:** Header cart icon; after add to cart

| Zone | Placement | Buttons / controls | Action |
|------|-----------|-------------------|--------|
| Header | Top right | X | Close drawer |
| Header | Title area | Badge with item count | Info |
| Empty state | Center | Продължи пазаруване | → `/` |
| Each item | Top right | Trash icon | Remove item |
| Each item | Bottom left | − / qty / + | Update quantity |
| Footer | Row 1 | Изчисти количката | Clear all items |
| Footer | Row 1 | Поръчка | → `/checkout` |
| Footer | Row 2 full width | Продължи пазаруване | Close drawer |
| Backdrop | Click | Close |

---

### 4. Filter drawer (`FilterDrawer.tsx`)

**Opened from:** Филтри button on store pages  
**Desktop:** slides from left. **Mobile:** slides from bottom.

| Zone | Placement | Buttons / controls | Action |
|------|-----------|-------------------|--------|
| Header | Top right | X | Close |
| Header | Title | Филтри + active count badge | Info |
| Body top | Full width (if filters active) | Изчисти всички | Clear all filters |
| Body | Per property | Dropdowns, checkboxes, range inputs, clear X on text | Set filters |
| Footer | Full width | Покажи N продукта | Apply filters + close |
| Backdrop | Click | Close |

---

### 5. Product image fullscreen (`ProductMediaGallery.tsx`)

**Opened from:** Click product gallery image on detail page

| Zone | Placement | Buttons | Action |
|------|-----------|---------|--------|
| Top right | X circle button | Close |
| Center | Slider arrows / swipe | Change image |
| Backdrop | Click dark overlay | Close |

---

### 6. Mobile menu drawer (`Header.tsx`)

**Opened from:** ☰ hamburger (mobile/tablet, right-side panel)

**Screen 1 — Main menu**

| Placement | Item | Action |
|-----------|------|--------|
| Top right | X | Close menu |
| Center | MODABOX logo | → `/` |
| List rows | За него / За нея / Аксесоари (+ chevron) | Open categories screen OR → section if no categories |
| List row | Профил (logged in) | → `/user/dashboard` |
| List row | Изход (logged in) | Log out |
| List row | Вход (guest) | → `/user` |

**Screen 2 — Categories**

| Placement | Item | Action |
|-----------|------|--------|
| Top left | ← Back | Return to main menu |
| Top right | X | Close entire menu |
| List | Category names (+ chevron if has children) | → filtered products OR open subcategories |
| List bottom | View all in section | → section page |

**Screen 3 — Subcategories** (when parent has children)

| Placement | Item | Action |
|-----------|------|--------|
| Top left | ← Back | Return to categories |
| Top right | X | Close menu |
| List | Subcategory names | → filtered products |

---

### 7. Order details modal (`user/dashboard/page.tsx`)

**Opened from:** Click order card in Orders tab

| Zone | Placement | Buttons | Action |
|------|-----------|---------|--------|
| Header | Top right | X | Close |
| Body | — | Order date, status, delivery, items, totals | Read-only |
| Footer | Bottom | Close / Затвори | Close |
| Backdrop | Click | Close |

---

### 8. Cookie consent (`CookieConsentBanner.tsx`)

See **Global shell** above.

---

### 9. Desktop mega-menu (`Header.tsx`)

Not a modal — hover panel under nav links. Category + subcategory buttons navigate to filtered listings; includes promotional product image on the right.

---

## Quick map: page → interactive overlays

| Page | Modals / drawers available |
|------|----------------------------|
| `/` | Add to cart, Quick login, Cart, Mobile menu, Cookies |
| Store pages | + Filter drawer |
| `/products/[id]` | Quick login, Cart, Image fullscreen, Mobile menu, Cookies |
| `/checkout` | Cart, Mobile menu, Cookies |
| `/checkout/success` | Cart, Mobile menu, Cookies |
| `/user/*` | Cart, Mobile menu, Cookies |
| `/user/dashboard` | + Order details modal |

---

*Generated from codebase — user-facing routes only (admin excluded).*
