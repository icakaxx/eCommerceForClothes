# Whitespace Anchoring Specification

## Overview
This document defines the visual anchor toolkit for addressing "too much empty whitespace" problems across the admin panel. The goal is to make pages feel intentional, structured, and premium.

## Visual Anchor Toolkit

### 1. Section Surfaces
**Purpose**: Create subtle background blocks behind content groups to visually anchor content and reduce floating appearance.

**When to Use**:
- Wrap primary content groups (tables, lists, grids)
- Group related content together
- Create visual separation between different sections
- When a single table/list sits alone in large white space

**Component**: `<SectionSurface>`

**Props**:
- `tone`: 'plain' (white bg) or 'soft' (subtle bg-slate-50/50) - default: 'soft'
- `padding`: 'md' (p-6) or 'lg' (p-8) - default: 'md'

**Usage**:
```tsx
<SectionSurface tone="soft" padding="md">
  {/* Table, list, or content group */}
</SectionSurface>
```

**Styles**:
- Soft tone: `bg-slate-50/50 border-slate-200/60 rounded-admin-card`
- Plain tone: `bg-white border-slate-200 rounded-admin-card`
- Padding: `p-6` (md) or `p-8` (lg)

### 2. Dividers
**Purpose**: Create consistent vertical spacing around a border line to separate sections.

**When to Use**:
- Between major content sections
- When transitioning between different content types
- To create visual breathing room without full section surfaces

**Component**: `<Divider>`

**Props**:
- `spacing`: 'md' (my-6) or 'lg' (my-8) - default: 'md'
- `variant`: 'default' (border-slate-200) or 'subtle' (border-slate-200/50) - default: 'default'

**Usage**:
```tsx
<Divider spacing="md" variant="default" />
```

**Styles**:
- Default: `border-t border-slate-200 my-6`
- Subtle: `border-t border-slate-200/50 my-6`

### 3. Empty States
**Purpose**: Provide guidance when content is missing or lists are empty, replacing blank space with intentional messaging.

**When to Use**:
- When lists/tables are empty
- When data is missing
- When content is sparse
- Instead of showing blank space or generic "No items" text

**Component**: `<EmptyState>`

**Props**:
- `title`: string (required) - Main message
- `description?`: string - Additional context
- `action?`: ReactNode - Optional action button
- `icon?`: LucideIcon - Optional icon

**Usage**:
```tsx
<EmptyState
  title="No Properties"
  description="Create your first property to start organizing your products."
  action={<button>Create Property</button>}
  icon={List}
/>
```

**Styles**:
- Centered content inside a Card
- Icon in circular bg-slate-100 container
- Title: text-lg sm:text-xl font-semibold
- Description: text-sm sm:text-base text-gray-600

### 4. Section Headers
**Purpose**: Frame content areas with clear titles and optional descriptions.

**When to Use**:
- Above major content blocks
- To introduce table/list sections
- When content needs context
- To create visual hierarchy

**Component**: `<Section>` (with title prop)

**Usage**:
```tsx
<Section
  title="Properties List"
  description="Manage product properties and their values"
>
  {/* Content */}
</Section>
```

### 5. Two-Column Layout (Optional)
**Purpose**: Provide structured layout for wide screens with optional right-rail content.

**When to Use**:
- On pages that feel empty on large screens
- When you have secondary content (tips, filters, summaries)
- To utilize wide screen real estate effectively

**Component**: `<TwoColumnLayout>`

**Props**:
- `main`: ReactNode (required) - Main content
- `aside?`: ReactNode - Right-rail content (hidden on mobile)
- `mainWidth`: 'default' (2/3) or 'wide' (3/4) - default: 'default'

**Usage**:
```tsx
<TwoColumnLayout
  main={<MainContent />}
  aside={
    <Card>
      <h3>Quick Tips</h3>
      <p>Helpful information...</p>
    </Card>
  }
/>
```

## Spacing Rules

### Vertical Rhythm
- **Section Gap**: `space-y-6` (24px) - standard spacing between sections
- **Large Section Gap**: `space-y-8` (32px) - larger spacing when needed
- **Divider Spacing**: `my-6` (md) or `my-8` (lg)

### Background Tones
- **Soft Surface**: `bg-slate-50/50` - subtle, non-intrusive
- **Plain Surface**: `bg-white` - clean, minimal
- **Border**: `border-slate-200` or `border-slate-200/60` for soft surfaces

## Application Rules

### Pages with Sparse Content
Apply these patterns to pages where content sits "floating" in large white space:

1. **Properties List Page**:
   - Wrap table in `<SectionSurface tone="soft">`
   - Add `<Section>` with title above table
   - Use `<EmptyState>` when no properties exist

2. **Product Types Page**:
   - Wrap table in `<SectionSurface tone="soft">`
   - Add `<Section>` with title and description
   - Use `<EmptyState>` when no product types exist

3. **Media Library**:
   - Wrap upload area in `<Card>` within `<Section>`
   - Wrap media grid in `<SectionSurface tone="soft">`
   - Use `<EmptyState>` when folder is empty
   - Add section headers for upload and grid areas

4. **Single Table Pages**:
   - Always wrap table in `<SectionSurface>`
   - Add section header above table
   - Use empty state when table is empty

### Dashboard-Specific
- Ensure charts/cards occupy consistent grid with `gap-6`
- Wrap metric cards in `<SectionSurface tone="soft">` within a `<Section>`
- Add section headers for each major group
- Use empty states for sparse chart areas (if applicable)

## Verification Checklist

When refactoring a page, verify:
- [ ] No page has a single floating table in an ocean of white
- [ ] Each page has at least 2 visual anchors: header + section surface OR divider + empty state
- [ ] Wide screens feel intentionally structured, not empty
- [ ] Empty states appear where data is missing
- [ ] Section surfaces group related content
- [ ] Section headers provide context for content blocks
- [ ] Consistent spacing rhythm throughout (gap-6 between sections)
- [ ] Background tones are subtle and non-intrusive

## Implementation Examples

### Example 1: Table with Empty State
```tsx
<Section
  title="Properties List"
  description="Manage product properties"
>
  {properties.length === 0 ? (
    <EmptyState
      title="No Properties"
      description="Create your first property..."
      action={<button>Create</button>}
      icon={List}
    />
  ) : (
    <SectionSurface tone="soft" padding="md">
      <DataTableShell>
        {/* Table content */}
      </DataTableShell>
    </SectionSurface>
  )}
</Section>
```

### Example 2: Dashboard Metrics
```tsx
<Section
  title="Key Metrics"
  description="Overview of sales and activity"
>
  <SectionSurface tone="soft" padding="md">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Metric cards */}
    </div>
  </SectionSurface>
</Section>
```

### Example 3: Media Library
```tsx
<Section title="Upload Files">
  <Card>
    {/* Upload area */}
  </Card>
</Section>

<Section title="Media Grid">
  {files.length === 0 ? (
    <EmptyState title="No Files" icon={ImageIcon} />
  ) : (
    <SectionSurface tone="soft" padding="md">
      {/* Grid content */}
    </SectionSurface>
  )}
</Section>
```

## Files Modified

- `app/admin/components/layout/SectionSurface.tsx` - Surface component
- `app/admin/components/layout/Divider.tsx` - Divider component
- `app/admin/components/layout/EmptyState.tsx` - Empty state component
- `app/admin/components/layout/TwoColumnLayout.tsx` - Two-column layout
- `app/admin/components/layout/index.ts` - Component exports
- `app/admin/properties/page.tsx` - Applied visual anchors
- `app/admin/product-types/page.tsx` - Applied visual anchors
- `app/admin/media/page.tsx` - Applied visual anchors
- `app/admin/components/Dashboard.tsx` - Enhanced with visual grid rhythm

## Pages Refactored

- ✅ Properties (`app/admin/properties/page.tsx`)
- ✅ Product Types (`app/admin/product-types/page.tsx`)
- ✅ Media Library (`app/admin/media/page.tsx`)
- ✅ Dashboard (`app/admin/components/Dashboard.tsx`)
