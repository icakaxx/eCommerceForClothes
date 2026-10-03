# Admin Layout System Specification

## Overview
This document defines the tokenized layout system for the admin panel, ensuring consistent visual hierarchy and spacing across all admin pages.

## Design Tokens

### Container Widths
- **Admin Container Max Width**: `1400px` (max-w-admin-container)
- **Responsive Padding**:
  - Mobile: `1rem` (16px) - `px-4`
  - Desktop: `2rem` (32px) - `md:px-8`
- **Vertical Padding**: `2rem` (32px) - `py-8`

### Spacing Rhythm
- **Section Gap**: `1.5rem` (24px) - standard spacing between sections
- **Large Section Gap**: `2rem` (32px) - larger spacing when needed
- **Card Padding**: `1.5rem` (24px) - standard card padding (`p-6`)
- **Card Padding Large**: `2rem` (32px) - larger card padding (`p-8`)

### Border Radius
- **Card Radius**: `0.75rem` (12px) - `rounded-admin-card`
- **Card Radius Large**: `1rem` (16px) - `rounded-admin-card-lg`

### Shadows
- **Card Shadow**: `shadow-admin-card` - subtle shadow for cards
- **Card Shadow Hover**: `shadow-admin-card-hover` - hover state shadow

### Typography Scale
- **H1 (Page Title)**: `text-admin-h1` - `1.875rem` (30px), font-semibold (600), tracking-tight
- **H2 (Section Title)**: `text-admin-h2` - `1.25rem` (20px), font-semibold (600)
- **Subtitle**: `text-admin-subtitle` - `0.875rem` (14px), text-gray-600
- **Body**: Standard text sizes (text-sm, text-base)
- **Meta/Muted**: text-gray-600 or text-gray-500 for secondary text

## Layout Components

### 1. AdminPage
**Purpose**: Main wrapper for admin pages providing consistent container width and padding.

**Props**:
- `children`: ReactNode (required)
- `className?`: string - Additional classes
- `bleed?`: boolean - If true, removes horizontal padding (allows content to bleed to edges)

**Usage**:
```tsx
<AdminPage>
  {/* Page content */}
</AdminPage>
```

**Styles**:
- Max width: 1400px
- Horizontal padding: px-4 md:px-8
- Vertical padding: py-8

### 2. PageHeader
**Purpose**: Consistent page header with title, subtitle, and actions.

**Props**:
- `title`: string (required)
- `subtitle?`: string - Optional subtitle
- `actions?`: ReactNode - Right-aligned actions (buttons, selects, etc.)
- `className?`: string - Additional classes

**Usage**:
```tsx
<PageHeader
  title="Page Title"
  subtitle="Optional subtitle text"
  actions={<button>Action</button>}
/>
```

**Layout**:
- Title: text-admin-h1 (text-3xl, font-semibold, tracking-tight)
- Subtitle: text-admin-subtitle (text-sm), text-gray-600
- Actions: Right-aligned, responsive stack on mobile
- Spacing: mb-6 (24px) margin below header

### 3. Section
**Purpose**: Consistent section wrapper for page content grouping.

**Props**:
- `title?`: string - Optional section title
- `description?`: string - Optional section description
- `actions?`: ReactNode - Optional right-aligned actions
- `children`: ReactNode (required)
- `className?`: string - Additional classes

**Usage**:
```tsx
<Section
  title="Section Title"
  description="Section description"
  actions={<button>Action</button>}
>
  {/* Section content */}
</Section>
```

**Styles**:
- Spacing: space-y-4 between sections
- Title: text-admin-h2 (text-xl, font-semibold)

### 4. Card
**Purpose**: Consistent card container with standardized padding, border, radius, and shadow.

**Props**:
- `children`: ReactNode (required)
- `className?`: string - Additional classes
- `style?`: CSSProperties - Inline styles (for theme colors)
- `variant?`: 'default' | 'subtle' - Card style variant
- `padding?`: 'none' | 'small' | 'default' | 'large' - Padding size

**Usage**:
```tsx
<Card variant="default" padding="default">
  {/* Card content */}
</Card>
```

**Styles**:
- Default variant: bg-white, border border-slate-200, shadow-admin-card, rounded-admin-card
- Subtle variant: bg-white, border border-slate-200/50, no shadow
- Padding: p-6 (24px) by default, p-4 (16px) for small, p-8 (32px) for large

### 5. DataTableShell
**Purpose**: Consistent table container styling with rounded corners, border, and overflow handling.

**Props**:
- `children`: ReactNode (required) - Should contain `<table>` element
- `className?`: string - Additional classes

**Usage**:
```tsx
<DataTableShell>
  <TableHeader>
    <TableHeaderRow>
      <TableHeaderCell>Column 1</TableHeaderCell>
      <TableHeaderCell align="right">Column 2</TableHeaderCell>
    </TableHeaderRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data 1</TableCell>
      <TableCell align="right">Data 2</TableCell>
    </TableRow>
  </TableBody>
</DataTableShell>
```

**Helper Components**:
- `TableHeader`: Wraps `<thead>` with bg-slate-50
- `TableHeaderRow`: Standard header row
- `TableHeaderCell`: Header cell with consistent styling (props: `align?: 'left' | 'right' | 'center'`)
- `TableBody`: Wraps `<tbody>` with bg-white divide-y
- `TableRow`: Standard row with hover:bg-slate-50/60, h-12 (props: `onClick?`)
- `TableCell`: Standard cell with consistent padding (props: `align?: 'left' | 'right' | 'center'`)

**Styles**:
- Container: rounded-admin-card, border border-slate-200, bg-white, overflow-hidden
- Header: bg-slate-50
- Rows: h-12 (48px), hover:bg-slate-50/60
- Cells: px-4 xl:px-6 py-4

## Standardization Rules

### Page Structure
Every admin page should follow this structure:
```tsx
<AdminLayout currentPath="/admin/page-path">
  <AdminPage className="space-y-6">
    <PageHeader
      title="Page Title"
      subtitle="Optional subtitle"
      actions={/* Optional actions */}
    />
    
    <Section title="Section Title">
      {/* Content */}
    </Section>
    
    {/* More sections */}
  </AdminPage>
</AdminLayout>
```

### Typography
- **H1 (Page Title)**: Always use `PageHeader` component - `text-admin-h1` (text-3xl, font-semibold, tracking-tight)
- **H2 (Section Title)**: Use `Section` component with title prop - `text-admin-h2` (text-xl, font-semibold)
- **Subtitle**: Use `PageHeader` or `Section` subtitle prop - `text-admin-subtitle` (text-sm), text-gray-600
- **Body**: Use standard Tailwind text sizes (text-sm, text-base)

### Spacing
- **Page Top Padding**: Consistent (py-8) via AdminPage
- **Gap Between Header and Content**: Consistent (mt-6) via PageHeader mb-6
- **Section Spacing**: Consistent (space-y-6) via AdminPage className
- **Card Padding**: Consistent (p-6) via Card component

### Cards
- **Padding**: p-6 (24px) by default
- **Border**: border border-slate-200
- **Radius**: rounded-admin-card (12px)
- **Shadow**: shadow-admin-card
- **Background**: bg-white (can be overridden with style prop for theme colors)

### Tables
- **Container**: Use DataTableShell component
- **Row Height**: h-12 (48px) via TableRow
- **Header Background**: bg-slate-50 via TableHeader
- **Hover State**: hover:bg-slate-50/60 via TableRow
- **Padding**: px-4 xl:px-6 py-4 via TableCell

## Consistency Checklist

When refactoring a page, verify:
- [ ] Uses `<AdminPage>` wrapper
- [ ] Uses `<PageHeader>` for the title area
- [ ] Page title is text-admin-h1 (text-3xl, font-semibold, tracking-tight)
- [ ] Same container width/padding (via AdminPage)
- [ ] Same spacing between sections (space-y-6)
- [ ] Uses `<Section>` for major content groupings
- [ ] Uses `<Card>` component for card containers
- [ ] Uses `<DataTableShell>` and table helper components for tables
- [ ] Consistent card padding (p-6)
- [ ] Consistent card border/radius/shadow
- [ ] Consistent table styling (row height, header bg, hover state)

## Implementation Notes

1. **Theme Compatibility**: Components use standard Tailwind classes. For theme-based colors, use the `style` prop (e.g., `style={{ backgroundColor: theme.colors.surface }}`).

2. **Responsive Behavior**: All components are responsive by default:
   - PageHeader actions stack on mobile
   - AdminPage uses responsive padding
   - Cards and tables are responsive

3. **Import Path**: Import components from `@/app/admin/components/layout` or `../components/layout` (relative).

4. **Migration**: When refactoring existing pages:
   - Replace container divs with `<AdminPage>`
   - Replace header markup with `<PageHeader>`
   - Replace section divs with `<Section>`
   - Replace card divs with `<Card>`
   - Replace table containers with `<DataTableShell>` and helper components
   - Remove inconsistent spacing utilities
   - Ensure responsive behavior is maintained

## Files Modified

- `tailwind.config.js` - Added design tokens
- `lib/utils.ts` - Added cn() utility for class merging
- `app/admin/components/layout/AdminPage.tsx` - Main page wrapper
- `app/admin/components/layout/PageHeader.tsx` - Page header component
- `app/admin/components/layout/Section.tsx` - Section wrapper
- `app/admin/components/layout/Card.tsx` - Card component
- `app/admin/components/layout/DataTableShell.tsx` - Table components
- `app/admin/components/layout/index.ts` - Component exports

## Pages Refactored

- ✅ Dashboard (`app/admin/components/Dashboard.tsx`)
- ✅ Properties (`app/admin/properties/page.tsx`) - Header refactored
- ⏳ Products, Sales, Customers, Analytics, Finance, Discounts, Media, Product Types, Settings, Orders, Visitors - To be refactored
