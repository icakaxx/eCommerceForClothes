import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { apiErrorResponse } from '@/lib/api-error';


// GET - Get single property
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('propertyid', id)
      .single();

    if (error || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      property
    });

  } catch (error) {
    logger.error('Failed to get property:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update property
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const body = await request.json();

    const { name, description, datatype } = body;

    const { data: property, error } = await supabase
      .from('properties')
      .update({
        name,
        description: description || null,
        datatype: datatype || 'text',
        updatedat: new Date().toISOString()
      })
      .eq('propertyid', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating property:', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error });
    }

    return NextResponse.json({
      success: true,
      property
    });

  } catch (error) {
    logger.error('Failed to update property:', error);
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
  }
}

// DELETE - Delete property
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    const { data: productPropertyValues, error: productPropertyError } = await supabase
      .from('product_property_values')
      .select('productid')
      .eq('propertyid', id);

    if (productPropertyError) {
      logger.error('Error fetching product property values:', productPropertyError);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: productPropertyError });
    }

    const { data: variantPropertyValues, error: variantPropertyError } = await supabase
      .from('product_variant_property_values')
      .select('product_variants(productid)')
      .eq('propertyid', id);

    if (variantPropertyError) {
      logger.error('Error fetching product variant property values:', variantPropertyError);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: variantPropertyError });
    }

    const productIds = new Set<string>();
    (productPropertyValues || []).forEach((row: any) => {
      if (row.productid) productIds.add(row.productid);
    });
    (variantPropertyValues || []).forEach((row: any) => {
      const productId = row.product_variants?.productid;
      if (productId) productIds.add(productId);
    });

    const productIdList = Array.from(productIds);
    if (productIdList.length > 0) {
      const { error: variantsError } = await supabase
        .from('product_variants')
        .delete()
        .in('productid', productIdList);

      if (variantsError) {
        logger.error('Error deleting product variants:', variantsError);
        return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: variantsError });
      }

      const { error: productsError } = await supabase
        .from('products')
        .update({ isdeleted: true, updatedat: new Date().toISOString() })
        .in('productid', productIdList);

      if (productsError) {
        logger.error('Error deleting products:', productsError);
        return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: productsError });
      }
    }

    const { error: variantLinksError } = await supabase
      .from('product_variant_property_values')
      .delete()
      .eq('propertyid', id);

    if (variantLinksError) {
      logger.error('Error deleting product variant property links:', variantLinksError);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: variantLinksError });
    }

    const { error: productLinksError } = await supabase
      .from('product_property_values')
      .delete()
      .eq('propertyid', id);

    if (productLinksError) {
      logger.error('Error deleting product property links:', productLinksError);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: productLinksError });
    }

    const { error: typeLinksError } = await supabase
      .from('product_type_properties')
      .delete()
      .eq('propertyid', id);

    if (typeLinksError) {
      logger.error('Error deleting product type property links:', typeLinksError);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: typeLinksError });
    }

    const { error: valuesError } = await supabase
      .from('property_values')
      .delete()
      .eq('propertyid', id);

    if (valuesError) {
      logger.error('Error deleting property values:', valuesError);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: valuesError });
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('propertyid', id);

    if (error) {
      logger.error('Error deleting property:', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error });
    }

    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete property:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




