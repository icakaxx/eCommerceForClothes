export interface StockVariant {
  productvariantid: string;
  productid: string;
  product_name: string;
  sku: string | null;
  price: number;
  quantity: number;
  primary_image?: string | null;
  characteristics: Array<{ property_name: string; value: string }>;
}

export type OrderFormLine = {
  id: string;
  productVariantId: string;
  label: string;
  image: string | null;
  available: number;
  quantity: number;
  unitPrice: number;
};

export function uid() {
  return Math.random().toString(36).slice(2, 11);
}

export function isSizeProperty(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes('size') || n.includes('размер');
}

export function getVariantOptionLabel(v: StockVariant): string {
  const sizeChar = v.characteristics.find((c) => isSizeProperty(c.property_name));
  const otherChars = v.characteristics.filter((c) => !isSizeProperty(c.property_name));

  const parts: string[] = [];
  if (sizeChar?.value) parts.push(sizeChar.value);
  if (otherChars.length) parts.push(...otherChars.map((c) => c.value));
  if (!parts.length) {
    const all = v.characteristics.map((c) => c.value).filter(Boolean);
    if (all.length) parts.push(...all);
    else if (v.sku) parts.push(v.sku);
    else parts.push(v.productvariantid.slice(0, 8));
  }

  return `${parts.join(' · ')} · Q:${v.quantity}`;
}

export function sortVariantsForPicker(list: StockVariant[]): StockVariant[] {
  return [...list].sort((a, b) => {
    const sizeA = a.characteristics.find((c) => isSizeProperty(c.property_name))?.value ?? '';
    const sizeB = b.characteristics.find((c) => isSizeProperty(c.property_name))?.value ?? '';
    const numA = parseFloat(sizeA);
    const numB = parseFloat(sizeB);
    if (!Number.isNaN(numA) && !Number.isNaN(numB) && sizeA !== '' && sizeB !== '') {
      return numA - numB;
    }
    return getVariantOptionLabel(a).localeCompare(getVariantOptionLabel(b), 'bg', { numeric: true });
  });
}

export function stockWarningBg(language: string, available: number, lineQty: number): string | null {
  if (available < 0) {
    return language === 'bg'
      ? 'Внимание: този артикул в момента няма наличност. Можеш да продължиш, ако очакваш доставка.'
      : 'Warning: no stock. You can continue if delivery is expected.';
  }
  if (available < lineQty) {
    return language === 'bg'
      ? 'Внимание: няма достатъчна наличност за този артикул/размер. Можеш да продължиш, ако очакваш доставка.'
      : 'Warning: insufficient stock. You can continue if delivery is expected.';
  }
  const after = available - lineQty;
  if (after === 1) {
    return language === 'bg'
      ? 'Внимание: след тази поръчка ще остане само 1 бройка от този артикул.'
      : 'Warning: only 1 piece will remain after this order.';
  }
  return null;
}

export function splitCustomerName(fullName: string): { first: string; last: string } {
  const t = fullName.trim();
  if (!t) return { first: 'Клиент', last: '' };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}
