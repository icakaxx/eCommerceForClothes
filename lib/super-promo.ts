import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import {
  getDiscountPercentFromPrices,
  getVariantEffectivePrice,
  roundMoney,
} from '@/lib/product-promo';
import { getProductStorefrontUrl, getSuperPromoProductPath } from '@/lib/storefront-url';
import { getVariantPropertyValues, isSizePropertyKey } from '@/lib/variant-stock';
import { normalizeProductImages } from '@/lib/product-images';

export interface SuperPromoItemRow {
  superpromoid: string;
  productid: string;
  productvariantid: string;
  promoprice: number;
  sortorder: number;
  isactive: boolean;
  createdat?: string;
  updatedat?: string;
}

export interface SuperPromoDisplayItem {
  superpromoid: string;
  productid: string;
  productvariantid: string;
  promoPrice: number;
  originalPrice: number;
  discountPercent: number;
  sortorder: number;
  isactive: boolean;
  name: string;
  brand: string;
  model: string;
  color: string;
  size: string;
  imageUrl: string;
  images: string[];
  productUrl: string;
  productPath: string;
  inStock: boolean;
  quantity: number;
  category: 'clothes' | 'shoes' | 'accessories';
  isStale?: boolean;
  staleReason?: string;
}

function parseVariantProps(variant: Record<string, unknown>) {
  const props = getVariantPropertyValues(variant);
  let color = '';
  let size = '';

  props.forEach(({ nameKey, value }) => {
    if (nameKey.includes('color') || nameKey.includes('colour') || nameKey.includes('цвят')) {
      color = value;
    } else if (isSizePropertyKey(nameKey, nameKey)) {
      size = value;
    }
  });

  return { color, size };
}

function splitProductName(name: string) {
  const parts = name.split(' ');
  return {
    brand: parts[0] || '',
    model: parts.slice(1).join(' ') || name,
  };
}

type ProductSummary = {
  name?: string;
  promodiscountpercent?: number | null;
  isdisabled?: boolean;
  isdeleted?: boolean;
};

type VariantRecord = {
  productvariantid: string;
  productid: string;
  price: number;
  promotional_price?: number | null;
  quantity: number;
  trackquantity?: boolean | null;
  isvisible?: boolean | null;
  products: ProductSummary | ProductSummary[];
  product_variant_property_values?: Array<{
    value?: string;
    properties?: { name?: string } | { name?: string }[];
  }>;
};

function unwrapProduct(productRaw: VariantRecord['products']): ProductSummary | null {
  if (!productRaw) return null;
  return Array.isArray(productRaw) ? productRaw[0] || null : productRaw;
}

function getImagesForVariant(
  imagesByProduct: Map<string, Array<{ productvariantid: string | null; imageurl: string }>>,
  productId: string,
  variantId: string
): string[] {
  const productImages = imagesByProduct.get(productId) || [];
  const variantImages = productImages
    .filter((img) => img.productvariantid === variantId)
    .map((img) => img.imageurl)
    .filter(Boolean);

  if (variantImages.length > 0) {
    return variantImages;
  }

  return productImages
    .filter((img) => !img.productvariantid)
    .map((img) => img.imageurl)
    .filter(Boolean);
}

export async function getActiveSuperPromoPriceMap(
  supabase: SupabaseClient,
  variantIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (variantIds.length === 0) return map;

  const { data } = await supabase
    .from('super_promo_items')
    .select('productvariantid, promoprice')
    .in('productvariantid', variantIds)
    .eq('isactive', true);

  (data || []).forEach((row) => {
    const price = roundMoney(Number(row.promoprice));
    if (price > 0) {
      map.set(row.productvariantid, price);
    }
  });

  return map;
}

export async function getActiveSuperPromoPrice(
  supabase: SupabaseClient,
  variantId: string
): Promise<number | null> {
  const map = await getActiveSuperPromoPriceMap(supabase, [variantId]);
  return map.get(variantId) ?? null;
}

export async function enrichSuperPromoItems(
  supabase: SupabaseClient,
  rows: SuperPromoItemRow[],
  options?: { includeStale?: boolean }
): Promise<SuperPromoDisplayItem[]> {
  if (rows.length === 0) return [];

  const includeStale = options?.includeStale === true;
  const variantIds = [...new Set(rows.map((row) => row.productvariantid))];
  const productIds = [...new Set(rows.map((row) => row.productid))];

  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select(`
      productvariantid,
      productid,
      price,
      promotional_price,
      quantity,
      trackquantity,
      isvisible,
      products (
        name,
        promodiscountpercent,
        isdisabled,
        isdeleted
      ),
      product_variant_property_values (
        value,
        properties (
          name
        )
      )
    `)
    .in('productvariantid', variantIds);

  if (variantsError) {
    logger.error('Super promo batch variant fetch failed', variantsError);
  }

  const variantMap = new Map<string, VariantRecord>();
  (variants || []).forEach((variant) => {
    variantMap.set(variant.productvariantid, variant as VariantRecord);
  });

  const { data: imageRows } = await supabase
    .from('product_images')
    .select('productid, productvariantid, imageurl, sortorder')
    .in('productid', productIds)
    .order('sortorder', { ascending: true });

  const imagesByProduct = new Map<string, Array<{ productvariantid: string | null; imageurl: string }>>();
  (imageRows || []).forEach((img) => {
    const list = imagesByProduct.get(img.productid) || [];
    list.push({
      productvariantid: img.productvariantid,
      imageurl: img.imageurl,
    });
    imagesByProduct.set(img.productid, list);
  });

  const staleProductIds = [
    ...new Set(
      rows
        .filter((row) => !variantMap.has(row.productvariantid))
        .map((row) => row.productid)
    ),
  ];

  const staleProductMap = new Map<string, ProductSummary>();
  if (staleProductIds.length > 0) {
    const { data: staleProducts } = await supabase
      .from('products')
      .select('productid, name, promodiscountpercent, isdisabled, isdeleted')
      .in('productid', staleProductIds);

    (staleProducts || []).forEach((product) => {
      staleProductMap.set(product.productid, product);
    });
  }

  const items: SuperPromoDisplayItem[] = [];

  for (const row of rows) {
    try {
      const promoPrice = roundMoney(Number(row.promoprice));
      const variant = variantMap.get(row.productvariantid);

      if (!variant) {
        logger.warn('Super promo variant missing', {
          superpromoid: row.superpromoid,
          variantId: row.productvariantid,
          productId: row.productid,
        });

        if (!includeStale) continue;

        const product = staleProductMap.get(row.productid);
        const productName = product?.name || 'Product';
        const { brand, model } = splitProductName(productName);
        const fallbackImages = normalizeProductImages(
          getImagesForVariant(imagesByProduct, row.productid, row.productvariantid).length > 0
            ? getImagesForVariant(imagesByProduct, row.productid, row.productvariantid)
            : ['/image.png']
        );

        items.push({
          superpromoid: row.superpromoid,
          productid: row.productid,
          productvariantid: row.productvariantid,
          promoPrice,
          originalPrice: promoPrice,
          discountPercent: 0,
          sortorder: row.sortorder,
          isactive: row.isactive,
          name: productName,
          brand,
          model,
          color: '',
          size: '',
          imageUrl: fallbackImages[0] || '/image.png',
          images: fallbackImages,
          productUrl: getProductStorefrontUrl(row.productid),
          productPath: getSuperPromoProductPath(row.productid, row.productvariantid),
          inStock: false,
          quantity: 0,
          category: 'clothes',
          isStale: true,
          staleReason: 'missing_variant',
        });
        continue;
      }

      const product = unwrapProduct(variant.products);
      if (!product || product.isdeleted || product.isdisabled) continue;
      if (variant.isvisible === false) continue;

      const imageUrls = getImagesForVariant(
        imagesByProduct,
        row.productid,
        row.productvariantid
      );
      const images = normalizeProductImages(imageUrls.length > 0 ? imageUrls : ['/image.png']);
      const productName = product.name || 'Product';
      const { brand, model } = splitProductName(productName);
      const { color, size } = parseVariantProps(variant as Record<string, unknown>);
      const originalPricing = getVariantEffectivePrice(variant, product);
      const originalPrice = originalPricing.original;
      const trackQuantity = variant.trackquantity !== false;
      const quantity = Number(variant.quantity) || 0;
      const inStock = !trackQuantity || quantity > 0;

      items.push({
        superpromoid: row.superpromoid,
        productid: row.productid,
        productvariantid: row.productvariantid,
        promoPrice,
        originalPrice,
        discountPercent: getDiscountPercentFromPrices(originalPrice, promoPrice),
        sortorder: row.sortorder,
        isactive: row.isactive,
        name: productName,
        brand,
        model,
        color,
        size,
        imageUrl: images[0] || '/image.png',
        images,
        productUrl: getProductStorefrontUrl(row.productid),
        productPath: getSuperPromoProductPath(row.productid, row.productvariantid),
        inStock,
        quantity,
        category: 'clothes',
      });
    } catch (error) {
      logger.error('Super promo enrich failed', error);
    }
  }

  return items;
}
