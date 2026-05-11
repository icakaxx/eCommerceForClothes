export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface StockVariant {
  productvariantid: string;
  productid: string;
  product_name: string;
  sku: string | null;
  price: number;
  quantity: number;
  trackquantity: boolean;
  primary_image?: string | null;
  characteristics: Array<{
    property_name: string;
    value: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const { data: variants, error: variantsError } = await supabaseAdmin
      .from('product_variants')
      .select(
        `
        productvariantid,
        productid,
        sku,
        price,
        quantity,
        trackquantity,
        products!inner (
          productid,
          name,
          isdeleted
        )
      `
      )
      .eq('products.isdeleted', false);

    if (variantsError) {
      console.error('Error fetching variants:', variantsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch variants',
      }, { status: 500 });
    }

    if (!variants || variants.length === 0) {
      return NextResponse.json({
        success: true,
        variants: [],
      });
    }

    const variantIds = variants.map((v) => v.productvariantid);
    const productIds = [...new Set(variants.map((v: any) => v.productid).filter(Boolean))];

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
      console.error('Error fetching property values:', propertyValuesError);
    }

    const propsByVariant: Record<string, Array<{ property_name: string; value: string }>> = {};
    (propertyValues || []).forEach((pv: any) => {
      const variantId = pv.productvariantid;
      const propertyName = pv.properties?.name || pv.Property?.name || 'Unknown';
      const value = pv.value || pv.Value || '';

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

    const stockVariants: StockVariant[] = variants.map((variant: any) => {
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
        quantity: variant.quantity || 0,
        trackquantity: variant.trackquantity !== false,
        primary_image: primary,
        characteristics: propsByVariant[variant.productvariantid] || [],
      };
    });

    return NextResponse.json({
      success: true,
      variants: stockVariants,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
