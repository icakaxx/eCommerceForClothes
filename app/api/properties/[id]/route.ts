import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

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
    console.error('Failed to get property:', error);
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
      console.error('Error updating property:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      property
    });

  } catch (error) {
    console.error('Failed to update property:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
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
      console.error('Error fetching product property values:', productPropertyError);
      return NextResponse.json(
        { error: productPropertyError.message },
        { status: 500 }
      );
    }

    const { data: variantPropertyValues, error: variantPropertyError } = await supabase
      .from('product_variant_property_values')
      .select('product_variants(productid)')
      .eq('propertyid', id);

    if (variantPropertyError) {
      console.error('Error fetching product variant property values:', variantPropertyError);
      return NextResponse.json(
        { error: variantPropertyError.message },
        { status: 500 }
      );
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
        console.error('Error deleting product variants:', variantsError);
        return NextResponse.json(
          { error: variantsError.message },
          { status: 500 }
        );
      }

      const { error: productsError } = await supabase
        .from('products')
        .update({ isdeleted: true, updatedat: new Date().toISOString() })
        .in('productid', productIdList);

      if (productsError) {
        console.error('Error deleting products:', productsError);
        return NextResponse.json(
          { error: productsError.message },
          { status: 500 }
        );
      }
    }

    const { error: variantLinksError } = await supabase
      .from('product_variant_property_values')
      .delete()
      .eq('propertyid', id);

    if (variantLinksError) {
      console.error('Error deleting product variant property links:', variantLinksError);
      return NextResponse.json(
        { error: variantLinksError.message },
        { status: 500 }
      );
    }

    const { error: productLinksError } = await supabase
      .from('product_property_values')
      .delete()
      .eq('propertyid', id);

    if (productLinksError) {
      console.error('Error deleting product property links:', productLinksError);
      return NextResponse.json(
        { error: productLinksError.message },
        { status: 500 }
      );
    }

    const { error: typeLinksError } = await supabase
      .from('product_type_properties')
      .delete()
      .eq('propertyid', id);

    if (typeLinksError) {
      console.error('Error deleting product type property links:', typeLinksError);
      return NextResponse.json(
        { error: typeLinksError.message },
        { status: 500 }
      );
    }

    const { error: valuesError } = await supabase
      .from('property_values')
      .delete()
      .eq('propertyid', id);

    if (valuesError) {
      console.error('Error deleting property values:', valuesError);
      return NextResponse.json(
        { error: valuesError.message },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('propertyid', id);

    if (error) {
      console.error('Error deleting property:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete property:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




