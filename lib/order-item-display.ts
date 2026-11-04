type PropertyValueRow = {
  value?: string | null;
  properties?: { name?: string | null } | Array<{ name?: string | null }> | null;
};

function propertyNameFromRow(pvv: PropertyValueRow): string {
  const props = pvv.properties;
  if (Array.isArray(props)) return (props[0]?.name ?? '').trim();
  return (props?.name ?? '').trim();
}

function normalizeVariantJoin(variantJoin: unknown): PropertyValueRow[] {
  const variant = Array.isArray(variantJoin) ? variantJoin[0] : variantJoin;
  if (!variant || typeof variant !== 'object') return [];
  const rows = (variant as { product_variant_property_values?: PropertyValueRow[] })
    .product_variant_property_values;
  return Array.isArray(rows) ? rows : [];
}

export type OrderItemVariantDisplay = {
  size?: string;
  color?: string;
  /** All variant properties keyed by property name */
  properties: Record<string, string>;
};

export function variantDisplayFromOrderItem(item: {
  product_variants?: unknown;
}): OrderItemVariantDisplay {
  const properties: Record<string, string> = {};
  let size: string | undefined;
  let color: string | undefined;

  for (const pvv of normalizeVariantJoin(item.product_variants)) {
    const name = propertyNameFromRow(pvv);
    const value = (pvv.value ?? '').trim();
    if (!name || !value) continue;
    properties[name] = value;
    const lower = name.toLowerCase();
    if (lower.includes('size') || lower.includes('размер')) size = value;
    else if (lower.includes('color') || lower.includes('colour') || lower.includes('цвят')) color = value;
  }

  return { size, color, properties };
}

/** Human-readable suffix for admin lists, e.g. " · размер L · цвят син" */
export function formatOrderItemVariantSuffix(display: OrderItemVariantDisplay): string {
  const parts: string[] = [];
  if (display.size) parts.push(`размер ${display.size}`);
  if (display.color) parts.push(`цвят ${display.color}`);

  const used = new Set(
    Object.keys(display.properties).filter((k) => {
      const l = k.toLowerCase();
      return l.includes('size') || l.includes('размер') || l.includes('color') || l.includes('цвят');
    })
  );

  for (const [name, value] of Object.entries(display.properties)) {
    if (used.has(name)) continue;
    parts.push(`${name} ${value}`);
  }

  return parts.length ? ` · ${parts.join(' · ')}` : '';
}

export function orderItemProductName(item: {
  products?: { name?: string | null } | Array<{ name?: string | null }> | null;
}): string {
  const products = item.products;
  if (Array.isArray(products)) return products[0]?.name?.trim() || 'Артикул';
  return products?.name?.trim() || 'Артикул';
}

export function formatAdminOrderItemLine(
  item: {
    quantity?: number;
    price?: number;
    products?: { name?: string | null } | Array<{ name?: string | null }> | null;
    product_variants?: unknown;
  },
  formatPrice: (amount: number) => string
): string {
  const name = orderItemProductName(item);
  const qty = item.quantity ?? 1;
  const price = Number(item.price ?? 0);
  const variantSuffix = formatOrderItemVariantSuffix(variantDisplayFromOrderItem(item));
  return `${name} × ${qty} — ${formatPrice(price)}${variantSuffix}`;
}
