import {
  formatOrderItemVariantSuffix,
  orderItemProductName,
  variantDisplayFromOrderItem,
} from '@/lib/order-item-display';

export type ProductGroupLine = {
  orderId: string;
  shipmentNumber: string | null;
  quantity: number;
  status: string | null;
  storedId: string | null;
};

export type ProductGroup = {
  key: string;
  productName: string;
  variantLabel: string;
  totalQuantity: number;
  shipmentCount: number;
  lines: ProductGroupLine[];
};

type OrderItemRow = {
  quantity?: number | null;
  products?: { name?: string | null } | Array<{ name?: string | null }> | null;
  product_variants?: unknown;
};

type ShipmentLink = {
  orderId: string;
  shipmentNumber: string | null;
  status: string | null;
  storedId: string | null;
};

export function buildProductGroups(
  orderItems: Array<OrderItemRow & { orderid: string }>,
  links: ShipmentLink[]
): ProductGroup[] {
  const linkByOrder = new Map<string, ShipmentLink>();
  for (const link of links) {
    if (!link.orderId) continue;
    linkByOrder.set(link.orderId, link);
  }

  const groups = new Map<string, ProductGroup>();

  for (const item of orderItems) {
    const productName = orderItemProductName(item);
    const variantLabel = formatOrderItemVariantSuffix(variantDisplayFromOrderItem(item));
    const key = `${productName}||${variantLabel}`;
    const link = linkByOrder.get(item.orderid);
    if (!link) continue;

    const qty = Math.max(1, Number(item.quantity ?? 1));
    const line: ProductGroupLine = {
      orderId: item.orderid,
      shipmentNumber: link.shipmentNumber,
      quantity: qty,
      status: link.status,
      storedId: link.storedId,
    };

    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        key,
        productName,
        variantLabel: variantLabel.replace(/^ · /, ''),
        totalQuantity: qty,
        shipmentCount: link.shipmentNumber ? 1 : 0,
        lines: [line],
      });
      continue;
    }

    existing.lines.push(line);
    existing.totalQuantity += qty;
  }

  for (const group of groups.values()) {
    group.shipmentCount = new Set(group.lines.map((row) => row.shipmentNumber).filter(Boolean)).size;
  }

  return [...groups.values()].sort((a, b) => {
    if (b.totalQuantity !== a.totalQuantity) return b.totalQuantity - a.totalQuantity;
    return a.productName.localeCompare(b.productName, 'bg');
  });
}