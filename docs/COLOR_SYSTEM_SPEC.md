# Admin Panel Color System Specification

## Overview

This document defines the color system for the admin panel, ensuring visual harmony, consistency, and premium appearance through a unified color palette.

## Design Principles

1. **Single Primary Color**: One brand accent color (Indigo) for primary actions and branding
2. **Semantic Colors**: Clear mapping of statuses to semantic colors (success/warning/danger/info)
3. **Muted Palette**: Reduced saturation for professional, calm appearance
4. **Consistent Usage**: Same colors used consistently across all pages
5. **Accessible Contrast**: All color combinations meet WCAG AA standards

---

## Color Tokens

### Primary Brand Color

- **Purpose**: Main brand accent, primary actions (buttons, links, highlights)
- **Color**: Indigo (HSL: `239 84% 67%`)
- **Usage**: 
  - Primary buttons (Save, Create, Add, Edit, Submit)
  - Active links and navigation
  - Focus states
  - Progress indicators
  - Primary chart color

**Variants:**
- `--primary`: Base color
- `--primary-foreground`: Text on primary (white)
- `--primary-hover`: Hover state (lighter)
- `--primary-active`: Active state (darker)

### Semantic Colors

#### Success (Green - Emerald)
- **Purpose**: Positive states, completed actions, success messages
- **Color**: Emerald (HSL: `142 71% 45%`)
- **Usage**:
  - Status: Completed, Delivered, Active
  - Success messages and notifications
  - Positive metrics (growth, increases)
  - Confirmation actions

**Variants:**
- `--success`: Base color
- `--success-foreground`: Text on success (white)
- `--success-bg`: Soft background (HSL: `142 71% 96%`)
- `--success-text`: Text color (HSL: `142 71% 30%`)

#### Warning (Amber)
- **Purpose**: Caution states, pending actions, attention needed
- **Color**: Amber (HSL: `38 92% 50%`)
- **Usage**:
  - Status: Pending, Processing, Awaiting
  - Warning messages
  - Important but non-critical alerts
  - Secondary actions

**Variants:**
- `--warning`: Base color
- `--warning-foreground`: Text on warning (white)
- `--warning-bg`: Soft background (HSL: `38 92% 96%`)
- `--warning-text`: Text color (HSL: `38 92% 25%`)

#### Danger (Red)
- **Purpose**: Error states, destructive actions, critical alerts
- **Color**: Red (HSL: `0 84% 60%`)
- **Usage**:
  - Status: Cancelled, Rejected, Refunded
  - Delete/Remove actions
  - Error messages
  - Negative metrics (decreases, declines)

**Variants:**
- `--danger`: Base color
- `--danger-foreground`: Text on danger (white)
- `--danger-bg`: Soft background (HSL: `0 84% 97%`)
- `--danger-text`: Text color (HSL: `0 84% 40%`)

#### Info (Sky Blue)
- **Purpose**: Informational states, neutral actions
- **Color**: Sky Blue (HSL: `199 89% 48%`)
- **Usage**:
  - Status: Shipped, In Progress
  - Informational messages
  - Secondary information
  - Neutral highlights

**Variants:**
- `--info`: Base color
- `--info-foreground`: Text on info (white)
- `--info-bg`: Soft background (HSL: `199 89% 96%`)
- `--info-text`: Text color (HSL: `199 89% 30%`)

### Neutral Scale

Based on Slate palette for consistent grays:

- `--background`: White (`0 0% 100%`)
- `--foreground`: Slate-900 (`222 47% 11%`)
- `--surface`: White (`0 0% 100%`)
- `--surface-2`: Slate-50 (`210 40% 98%`)
- `--border`: Slate-200 (`214 32% 91%`)
- `--muted`: Slate-100 (`210 40% 96%`)
- `--muted-foreground`: Slate-500 (`215 16% 47%`)
- `--text`: Slate-900 (`222 47% 11%`)
- `--text-secondary`: Slate-500 (`215 16% 47%`)

---

## Status Mapping

### Order Status → Badge Variant

| Status | Badge Variant | Semantic Meaning |
|--------|--------------|------------------|
| `delivered`, `completed` | `success` | Successful completion |
| `shipped` | `info` | In progress, informational |
| `confirmed` | `primary` | Primary action completed |
| `pending`, `processing`, `awaiting` | `warning` | Action needed, waiting |
| `cancelled`, `rejected`, `refunded` | `danger` | Failed/terminated |
| (default) | `neutral` | Unknown/other |

### Product Status → Badge Variant

| Status | Badge Variant |
|--------|--------------|
| `active`, `visible`, `enabled` | `success` |
| `pending`, `draft` | `warning` |
| `inactive`, `hidden`, `disabled` | `neutral` |
| `deleted`, `archived` | `danger` |

### Discount Status → Badge Variant

| Status | Badge Variant |
|--------|--------------|
| `active`, `isactive: true` | `success` |
| `inactive`, `isactive: false` | `danger` |
| `expired` | `warning` |

---

## Component Usage

### Badge Component

**Location**: `app/admin/components/Badge.tsx`

**Props:**
- `variant`: `'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'`
- `style`: `'soft' | 'solid'` (default: `'soft'`)
- `className`: Additional classes

**Default Style:**
- Font: `text-xs`
- Weight: `font-medium`
- Padding: `px-2 py-1`
- Radius: `rounded-full`

**Usage:**
```tsx
import { Badge } from '../components/layout';
import { getOrderStatusVariant } from '@/lib/admin-status-utils';

<Badge variant={getOrderStatusVariant(order.status)}>
  {statusText}
</Badge>

// Soft style (default) - tinted background
<Badge variant="success">Active</Badge>

// Solid style - full color background (rare, for critical emphasis)
<Badge variant="danger" style="solid">Cancelled</Badge>
```

### Button Colors

#### Primary Buttons (Most Common)
- **Color**: `bg-primary text-primary-foreground`
- **Hover**: `hover:opacity-90`
- **Active**: `active:opacity-80`
- **Usage**: Add, Create, Save, Submit, Edit, Confirm

```tsx
className="bg-primary text-primary-foreground rounded hover:opacity-90 active:opacity-80"
```

#### Success Buttons
- **Color**: `bg-success text-success-foreground`
- **Hover**: `hover:opacity-90`
- **Active**: `active:opacity-80`
- **Usage**: Generate, Activate, Enable, Confirm success actions

```tsx
className="bg-success text-success-foreground rounded hover:opacity-90 active:opacity-80"
```

#### Danger Buttons
- **Color**: `bg-danger text-danger-foreground`
- **Hover**: `hover:opacity-90`
- **Active**: `active:opacity-80`
- **Usage**: Delete, Remove, Cancel, Destructive actions

```tsx
className="bg-danger text-danger-foreground rounded hover:opacity-90 active:opacity-80"
```

#### Disabled State
- **Color**: `bg-muted text-muted-foreground`
- **Usage**: All button types when disabled

```tsx
className="... disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
```

### Icon Colors

#### Action Icons
- **Primary Actions** (Edit, View): `text-primary`
- **Danger Actions** (Delete, Remove): `text-danger`
- **Success Actions** (Check, Confirm): `text-success`

#### Hover States
- **Danger Icons**: `hover:text-danger-text hover:bg-danger-bg`
- **Primary Icons**: `hover:text-primary hover:bg-primary/10`

```tsx
// Delete icon
className="p-2 text-danger hover:text-danger-text hover:bg-danger-bg rounded"

// Edit icon
className="p-2 text-primary hover:bg-primary/10 rounded"
```

### Text Colors

- **Primary Text**: `text-foreground` or `text-text`
- **Secondary Text**: `text-muted-foreground` or `text-text-secondary`
- **Links**: `text-primary`
- **Success Metrics**: `text-success`
- **Danger Metrics**: `text-danger`
- **Warning**: `text-warning`

---

## Chart Colors

### Palette

Limited to 4-6 colors for consistency:

1. **Primary** (Indigo) - Main brand color
2. **Success** (Emerald) - Positive/secondary
3. **Info** (Sky Blue) - Informational/tertiary
4. **Warning** (Amber) - Attention/quaternary
5. **Slate-400** - Neutral (5th color)
6. **Slate-500** - Neutral darker (6th color)

### Category Color Mapping

**Location**: `lib/admin-chart-colors.ts`

Consistent mapping across all pages:

| Category | Color |
|----------|-------|
| Clothes | Primary (Indigo) |
| Shoes | Success (Emerald) |
| Accessories | Warning (Amber) |
| Perfumes | Success (Emerald) |
| Watches | Primary (Indigo) |
| Apparel | Warning (Amber) |

**Usage:**
```tsx
import { CHART_COLORS, getCategoryColor } from '@/lib/admin-chart-colors';

// Direct usage
<div className={CHART_COLORS.primary}>...</div>

// Category mapping
const color = getCategoryColor(category, index);
<div className={color}>...</div>
```

### Chart Color Rules

1. **Maximum 6 colors** in any chart
2. **Same palette** used across all pages
3. **Category mapping** is consistent (same category = same color)
4. **Muted saturation** for professional appearance
5. **Progress bars**: Neutral track with one accent color per series

---

## Implementation Files

### Core Configuration

1. **CSS Variables**: `app/globals.css`
   - Defines all color tokens as CSS custom properties
   - Uses HSL format for easy manipulation

2. **Tailwind Config**: `tailwind.config.js`
   - Maps CSS variables to Tailwind color utilities
   - Enables semantic color classes

3. **Badge Component**: `app/admin/components/Badge.tsx`
   - Reusable badge/status pill component
   - Supports all semantic variants

4. **Status Utilities**: `lib/admin-status-utils.ts`
   - Maps status strings to Badge variants
   - `getOrderStatusVariant()` function

5. **Chart Colors**: `lib/admin-chart-colors.ts`
   - Centralized chart palette
   - Category color mapping
   - Helper functions

### Updated Pages

- ✅ `app/admin/sales/page.tsx` - Status badges, button colors
- ✅ `app/admin/components/Dashboard.tsx` - Badges, chart colors, metrics
- ✅ `app/admin/products/page.tsx` - Buttons, icons, focus states
- ✅ `app/admin/discounts/page.tsx` - Badges, buttons
- 🔄 Other admin pages - Apply same patterns

---

## Migration Guide

### Replacing Color Classes

#### Status Badges

**Before:**
```tsx
<span className={`px-2 py-1 rounded-full ${
  status === 'completed' ? 'bg-green-100 text-green-800' :
  status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
  'bg-gray-100 text-gray-800'
}`}>
  {status}
</span>
```

**After:**
```tsx
import { Badge } from '../components/layout';
import { getOrderStatusVariant } from '@/lib/admin-status-utils';

<Badge variant={getOrderStatusVariant(status)}>
  {status}
</Badge>
```

#### Primary Buttons

**Before:**
```tsx
className="bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800"
```

**After:**
```tsx
className="bg-primary text-primary-foreground rounded hover:opacity-90 active:opacity-80"
```

#### Success Buttons

**Before:**
```tsx
className="bg-green-600 text-white rounded hover:bg-green-700 active:bg-green-800"
```

**After:**
```tsx
className="bg-success text-success-foreground rounded hover:opacity-90 active:opacity-80"
```

#### Danger Buttons

**Before:**
```tsx
className="bg-red-600 text-white rounded hover:bg-red-700 active:bg-red-800"
```

**After:**
```tsx
className="bg-danger text-danger-foreground rounded hover:opacity-90 active:opacity-80"
```

#### Chart Colors

**Before:**
```tsx
const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
const color = colors[index % colors.length];
```

**After:**
```tsx
import { CHART_COLORS_EXTENDED, getCategoryColor } from '@/lib/admin-chart-colors';
const color = getCategoryColor(category, index);
```

#### Icon Colors

**Before:**
```tsx
className="text-red-600 hover:text-red-900 hover:bg-red-50"
```

**After:**
```tsx
className="text-danger hover:text-danger-text hover:bg-danger-bg"
```

---

## Verification Checklist

- [x] CSS variables defined in `globals.css`
- [x] Tailwind config updated with semantic colors
- [x] Badge component created and exported
- [x] Status utilities created
- [x] Chart colors system created
- [x] Sales page updated (badges)
- [x] Dashboard updated (badges, charts, metrics)
- [x] Products page updated (buttons, icons)
- [x] Discounts page updated (badges, buttons)
- [ ] All other admin pages updated
- [ ] No arbitrary color classes (blue/green/yellow/purple/orange) remain
- [ ] Only one primary accent color appears
- [ ] All badges use Badge component
- [ ] Charts use consistent palette
- [ ] UI feels calmer and more premium

---

## Color Reference

### Quick Reference Table

| Use Case | Class | Color |
|----------|-------|-------|
| Primary button | `bg-primary text-primary-foreground` | Indigo |
| Success button | `bg-success text-success-foreground` | Emerald |
| Danger button | `bg-danger text-danger-foreground` | Red |
| Warning button | `bg-warning text-warning-foreground` | Amber |
| Info button | `bg-info text-info-foreground` | Sky Blue |
| Success badge | `<Badge variant="success">` | Emerald (soft) |
| Warning badge | `<Badge variant="warning">` | Amber (soft) |
| Danger badge | `<Badge variant="danger">` | Red (soft) |
| Primary text | `text-primary` | Indigo |
| Success metric | `text-success` | Emerald |
| Danger metric | `text-danger` | Red |
| Primary icon | `text-primary` | Indigo |
| Danger icon | `text-danger` | Red |
| Border | `border-border` | Slate-200 |
| Background | `bg-background` | White |
| Surface | `bg-surface` | White |
| Muted background | `bg-muted` | Slate-100 |

---

## Notes

- All color values use HSL format in CSS variables for consistency
- Hover states use opacity for simplicity (hover:opacity-90)
- Badges default to "soft" style (tinted background) for calmer appearance
- Solid badge style reserved for critical emphasis only
- Chart palette limited to 6 colors maximum
- Category colors are consistent across all pages
- Focus states use `focus:ring-primary` for consistency
