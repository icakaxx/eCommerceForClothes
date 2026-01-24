export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface StockVariant {
  productvariantid: string;
  productid: string;
  product_name: string;
  sku: string | null;
  quantity: number;
  trackquantity: boolean;
  characteristics: Array<{
    property_name: string;
    value: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Fetch all product variants with product info
    const { data: variants, error: variantsError } = await supabaseAdmin
      .from('product_variants')
      .select(`
        productvariantid,
        productid,
        sku,
        quantity,
        trackquantity,
        products!inner (
          productid,
          name,
          isdeleted
        )
      `)
      .eq('products.isdeleted', false);

    if (variantsError) {
      console.error('Error fetching variants:', variantsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch variants'
      }, { status: 500 });
    }

    if (!variants || variants.length === 0) {
      return NextResponse.json({
        success: true,
        variants: []
      });
    }

    // Fetch property values for all variants
    const variantIds = variants.map(v => v.productvariantid);
    
    const { data: propertyValues, error: propertyValuesError } = await supabaseAdmin
      .from('product_variant_property_values')
      .select(`
        productvariantid,
        value,
        properties!inner (
          propertyid,
          name
        )
      `)
      .in('productvariantid', variantIds);

    if (propertyValuesError) {
      console.error('Error fetching property values:', propertyValuesError);
      // Continue without property values rather than failing
    }

    // Group property values by variant
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
          value: value
        });
      }
    });

    // Process variants into the desired format
    const stockVariants: StockVariant[] = variants.map((variant: any) => {
      const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
      
      return {
        productvariantid: variant.productvariantid,
        productid: variant.productid,
        product_name: product?.name || 'Unknown Product',
        sku: variant.sku || null,
        quantity: variant.quantity || 0,
        trackquantity: variant.trackquantity !== false,
        characteristics: propsByVariant[variant.productvariantid] || []
      };
    });

    return NextResponse.json({
      success: true,
      variants: stockVariants
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
