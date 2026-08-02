export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  groupVariantsIntoProducts,
  type StockVariant,
} from '@/lib/admin-stock-utils';

export async function GET() {
  try {
    const { data: variants, error: variantsError } = await supabaseAdmin
      .from('product_variants')
      .select(
        `
        productvariantid,
        productid,
        sku,
        price,
        promotional_price,
        quantity,
        trackquantity,
        isvisible,
        products!inner (
          productid,
          name,
          isdeleted,
          isdisabled,
          awaitingrestock
        )
      `
      )
      .eq('products.isdeleted', false);

    if (variantsError) {
      logger.error('Error fetching variants:', variantsError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch variants',
        },
        { status: 500 }
      );
    }

    if (!variants || variants.length === 0) {
      return NextResponse.json({
        success: true,
        variants: [],
        products: [],
      });
    }

    const variantIds = variants.map((v) => v.productvariantid);
    const productIds = [...new Set(variants.map((v: { productid: string }) => v.productid).filter(Boolean))];

    const { data: propertyValues, error: propertyValuesError } = await supabaseAdmin
      .from('product_variant_property_values')
      .select(
        `
        productvariantid,
        value,
        properties!inner (
          propertyid,
          name
        )
      `
      )
      .in('productvariantid', variantIds);

    if (propertyValuesError) {
      logger.error('Error fetching property values:', propertyValuesError);
    }

    const propsByVariant: Record<string, Array<{ property_name: string; value: string }>> = {};
    (propertyValues || []).forEach((pv: {
      productvariantid?: string;
      value?: string;
      properties?: { name?: string } | { name?: string }[];
    }) => {
      const variantId = pv.productvariantid;
      const property = Array.isArray(pv.properties) ? pv.properties[0] : pv.properties;
      const propertyName = property?.name || 'Unknown';
      const value = pv.value || '';

      if (variantId && propertyName && value) {
        if (!propsByVariant[variantId]) {
          propsByVariant[variantId] = [];
        }
        propsByVariant[variantId].push({
          property_name: propertyName,
          value,
        });
      }
    });

    const firstImageByVariant: Record<string, string> = {};
    const firstImageByProduct: Record<string, string> = {};

    if (variantIds.length > 0) {
      const { data: variantImages } = await supabaseAdmin
        .from('product_images')
        .select('productvariantid, imageurl')
        .in('productvariantid', variantIds);
      (variantImages || []).forEach((row: { productvariantid?: string; imageurl?: string }) => {
        const vid = row.productvariantid;
        if (vid && row.imageurl && !firstImageByVariant[vid]) {
          firstImageByVariant[vid] = row.imageurl;
        }
      });
    }

    if (productIds.length > 0) {
      const { data: prodImages } = await supabaseAdmin
        .from('product_images')
        .select('productid, imageurl')
        .in('productid', productIds)
        .is('productvariantid', null);
      (prodImages || []).forEach((row: { productid?: string; imageurl?: string }) => {
        const pid = row.productid;
        if (pid && row.imageurl && !firstImageByProduct[pid]) {
          firstImageByProduct[pid] = row.imageurl;
        }
      });
    }

    const stockVariants: StockVariant[] = variants.map((variant: {
      productvariantid: string;
      productid: string;
      sku?: string | null;
      price?: number | null;
      promotional_price?: number | null;
      quantity?: number | null;
      trackquantity?: boolean | null;
      isvisible?: boolean | null;
      products?: {
        name?: string;
        isdisabled?: boolean | null;
        awaitingrestock?: boolean | null;
      } | Array<{
        name?: string;
        isdisabled?: boolean | null;
        awaitingrestock?: boolean | null;
      }>;
    }) => {
      const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
      const vid = variant.productvariantid;
      const pid = variant.productid;
      const primary =
        (vid && firstImageByVariant[vid]) || (pid && firstImageByProduct[pid]) || null;

      return {
        productvariantid: variant.productvariantid,
        productid: variant.productid,
        product_name: product?.name || 'Unknown Product',
        sku: variant.sku || null,
        price: Number(variant.price) || 0,
        promotional_price:
          variant.promotional_price != null && Number(variant.promotional_price) > 0
            ? Number(variant.promotional_price)
            : null,
        quantity: variant.quantity || 0,
        trackquantity: variant.trackquantity !== false,
        isvisible: variant.isvisible !== false,
        product_isdisabled: product?.isdisabled === true,
        product_awaitingrestock: product?.awaitingrestock === true,
        primary_image: primary,
        characteristics: propsByVariant[variant.productvariantid] || [],
      };
    });

    const products = groupVariantsIntoProducts(stockVariants);

    return NextResponse.json({
      success: true,
      variants: stockVariants,
      products,
    });
  } catch (error) {
    logger.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
