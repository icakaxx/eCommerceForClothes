import { Product } from '@/lib/data';

export const LOW_STOCK_MAX = 3;

export type OptionStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'untracked';

export function getVariantPropertyValues(variant: any): Array<{ nameKey: string; value: string }> {
  const raw =
    variant.ProductVariantPropertyvalues ||
    variant.ProductVariantPropertyValues ||
    variant.product_variant_property_values ||
    [];

  return raw
    .map((pv: any) => {
      const name =
        pv.Property?.name ||
        pv.Property?.Name ||
        pv.properties?.name ||
        pv.properties?.Name ||
        pv.propertyid ||
        '';
      const value = pv.value || pv.Value || '';
      if (!name || !value) return null;
      return { nameKey: String(name).toLowerCase(), value: String(value) };
    })
    .filter(Boolean) as Array<{ nameKey: string; value: string }>;
}

export function getVariantOptionsMap(variant: any): Record<string, string> {
  const map: Record<string, string> = {};
  getVariantPropertyValues(variant).forEach(({ nameKey, value }) => {
    map[nameKey] = value;
  });
  return map;
}

export function isSizePropertyKey(propertyKey: string, displayName?: string): boolean {
  const key = propertyKey.toLowerCase();
  const label = (displayName || propertyKey).toLowerCase();
  if (key === 'size' || key === 'razmer' || key === 'размер') return true;
  if (label.includes('size') || label.includes('размер')) return true;
  if (key.includes('size') || key.includes('razmer')) return true;
  return false;
}

export function findSizePropertyKey(
  selectedOptions: Record<string, string>,
  propertyNameMap: Record<string, string>
): string | null {
  for (const key of Object.keys(selectedOptions)) {
    if (isSizePropertyKey(key, propertyNameMap[key])) return key;
  }
  for (const key of Object.keys(propertyNameMap)) {
    if (isSizePropertyKey(key, propertyNameMap[key])) return key;
  }
  return null;
}

function variantTracksQuantity(variant: any): boolean {
  return variant.trackquantity !== false && variant.trackquantity !== null;
}

function effectiveQuantity(variant: any): number {
  if (!variantTracksQuantity(variant)) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, Number(variant.quantity) || 0);
}

/** Variants matching an option value plus all other currently selected options. */
export function getMatchingVariantsForOption(
  variants: any[],
  selectedOptions: Record<string, string>,
  propertyKey: string,
  optionValue: string
): any[] {
  return variants.filter((variant) => {
    const opts = getVariantOptionsMap(variant);
    if (opts[propertyKey] !== optionValue) return false;
    return Object.entries(selectedOptions).every(([key, val]) => {
      if (key === propertyKey) return true;
      return opts[key] === val;
    });
  });
}

/** Minimum tracked quantity among variants that match the partial/full selection. */
export function getOptionStockQuantity(
  variants: any[],
  selectedOptions: Record<string, string>,
  propertyKey: string,
  optionValue: string
): number {
  const matches = getMatchingVariantsForOption(variants, selectedOptions, propertyKey, optionValue);
  if (matches.length === 0) return 0;

  const tracked = matches.filter(variantTracksQuantity);
  if (tracked.length === 0) return Number.MAX_SAFE_INTEGER;

  return Math.min(...tracked.map(effectiveQuantity));
}

export function getOptionStockStatus(quantity: number): OptionStockStatus {
  if (quantity >= Number.MAX_SAFE_INTEGER / 2) return 'untracked';
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= LOW_STOCK_MAX) return 'low_stock';
  return 'in_stock';
}

export function variantHasSizeValue(variant: any, sizeValue: string): boolean {
  const target = sizeValue.trim().toLowerCase();
  return getVariantPropertyValues(variant).some(({ nameKey, value }) => {
    if (!isSizePropertyKey(nameKey)) return false;
    return value.trim().toLowerCase() === target;
  });
}

export function productHasSizeInStock(product: Product, sizeValue: string): boolean {
  const variants = (product.variants || product.Variants || []) as any[];
  return variants.some((variant) => {
    if (variant.isvisible === false) return false;
    if (!variantHasSizeValue(variant, sizeValue)) return false;
    return effectiveQuantity(variant) > 0;
  });
}

export function findSameSizeAlternatives(
  allProducts: Product[],
  params: {
    sizeValue: string;
    excludeProductId: string;
    producttypeid?: string;
    rfproducttypeid?: number | null;
    limit?: number;
  }
): Product[] {
  const { sizeValue, excludeProductId, producttypeid, rfproducttypeid, limit = 4 } = params;

  const candidates = allProducts.filter((p) => {
    const pid = String(p.id || p.productid || '');
    if (!pid || pid === excludeProductId) return false;
    if ((p as any).isdisabled === true) return false;
    if (p.visible === false) return false;
    return productHasSizeInStock(p, sizeValue);
  });

  const score = (p: Product): number => {
    let s = 0;
    const pt = p.productTypeID || (p as any).producttypeid;
    const rf = (p as any).rfproducttypeid;
    if (producttypeid && pt === producttypeid) s += 2;
    if (rfproducttypeid != null && rf === rfproducttypeid) s += 1;
    return s;
  };

  return candidates.sort((a, b) => score(b) - score(a)).slice(0, limit);
}
