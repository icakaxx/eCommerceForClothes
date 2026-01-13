/**
 * Admin Chart Colors - Consistent Palette
 * 
 * Limited palette (4-6 colors) used consistently across all admin charts.
 * Colors are muted for professional appearance.
 */

// Primary chart color palette (4 colors for categories)
export const CHART_COLORS = {
  primary: 'bg-primary',        // Indigo (primary brand)
  success: 'bg-success',        // Emerald (success/secondary)
  info: 'bg-info',              // Sky blue (info/tertiary)
  warning: 'bg-warning',        // Amber (warning/quaternary)
} as const;

// Extended palette (6 colors max) for when needed
export const CHART_COLORS_EXTENDED = [
  CHART_COLORS.primary,     // Indigo
  CHART_COLORS.success,     // Emerald
  CHART_COLORS.info,        // Sky blue
  CHART_COLORS.warning,     // Amber
  'bg-slate-400',           // Neutral gray (5th)
  'bg-slate-500',           // Neutral gray darker (6th)
] as const;

// Category to color mapping (consistent across all pages)
export const CATEGORY_COLOR_MAP: Record<string, string> = {
  'Clothes': CHART_COLORS.primary,
  'Shoes': CHART_COLORS.success,
  'Accessories': CHART_COLORS.warning,
  'Perfumes': CHART_COLORS.success,
  'Watches': CHART_COLORS.primary,
  'Apparel': CHART_COLORS.warning,
  // Add more categories as needed
};

/**
 * Get color for a category (returns mapped color or cycles through palette)
 */
export function getCategoryColor(category: string, index: number = 0): string {
  const mapped = CATEGORY_COLOR_MAP[category];
  if (mapped) return mapped;
  
  // Fallback: cycle through extended palette
  return CHART_COLORS_EXTENDED[index % CHART_COLORS_EXTENDED.length];
}
