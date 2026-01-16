import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get single product type with properties
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    // Get product type with associated properties
    const { data: productType, error: productTypeError } = await supabase
      .from('product_types')
      .select(`
        *,
        product_type_properties (
          producttypepropertyid,
          propertyid,
          properties (
            propertyid,
            name,
            description,
            datatype
          )
        )
      `)
      .eq('producttypeid', id)
      .single();

    if (productTypeError || !productType) {
      // If join fails, try basic query without properties
      if (productTypeError?.code === 'PGRST116' || productTypeError?.message?.includes('relation')) {
        const { data: basicProductType, error: basicError } = await supabase
          .from('product_types')
          .select('*')
          .eq('producttypeid', id)
          .single();

        if (basicError || !basicProductType) {
          return NextResponse.json(
            { error: 'Product type not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          productType: { ...basicProductType, product_type_properties: [] }
        });
      }

      return NextResponse.json(
        { error: 'Product type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      productType
    });

  } catch (error) {
    console.error('Failed to get product type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update product type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const body = await request.json();

    const { name } = body;

    const { data: productType, error } = await supabase
      .from('product_types')
      .update({
        name,
        updatedat: new Date().toISOString()
      })
      .eq('producttypeid', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product type:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      productType
    });

  } catch (error) {
    console.error('Failed to update product type:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    const { data: productsForType, error: productsForTypeError } = await supabase
      .from('products')
      .select('productid')
      .eq('producttypeid', id);

    if (productsForTypeError) {
      console.error('Error loading products for product type:', productsForTypeError);
      return NextResponse.json(
        { error: productsForTypeError.message },
        { status: 500 }
      );
    }

    const productIds = (productsForType || []).map((product) => product.productid);

    if (productIds.length > 0) {
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('productvariantid')
        .in('productid', productIds);

      if (variantsError) {
        console.error('Error loading variants for product type:', variantsError);
        return NextResponse.json(
          { error: variantsError.message },
          { status: 500 }
        );
      }

      const variantIds = (variants || []).map((variant) => variant.productvariantid);

      const { error: relatedProductsError } = await supabase
        .from('related_products')
        .delete()
        .in('productid', productIds);

      if (relatedProductsError) {
        console.error('Error deleting related products (productid):', relatedProductsError);
        return NextResponse.json(
          { error: relatedProductsError.message },
          { status: 500 }
        );
      }

      const { error: relatedProductRefsError } = await supabase
        .from('related_products')
        .delete()
        .in('relatedproductid_ref', productIds);

      if (relatedProductRefsError) {
        console.error('Error deleting related products (relatedproductid_ref):', relatedProductRefsError);
        return NextResponse.json(
          { error: relatedProductRefsError.message },
          { status: 500 }
        );
      }

      const { error: productImagesError } = await supabase
        .from('product_images')
        .delete()
        .in('productid', productIds);

      if (productImagesError) {
        console.error('Error deleting product images:', productImagesError);
        return NextResponse.json(
          { error: productImagesError.message },
          { status: 500 }
        );
      }

      if (variantIds.length > 0) {
        const { error: variantPropertyValuesError } = await supabase
          .from('product_variant_property_values')
          .delete()
          .in('productvariantid', variantIds);

        if (variantPropertyValuesError) {
          console.error('Error deleting variant property values:', variantPropertyValuesError);
          return NextResponse.json(
            { error: variantPropertyValuesError.message },
            { status: 500 }
          );
        }
      }

      const { error: productPropertyValuesError } = await supabase
        .from('product_property_values')
        .delete()
        .in('productid', productIds);

      if (productPropertyValuesError) {
        console.error('Error deleting product property values:', productPropertyValuesError);
        return NextResponse.json(
          { error: productPropertyValuesError.message },
          { status: 500 }
        );
      }

      const { error: variantsDeleteError } = await supabase
        .from('product_variants')
        .delete()
        .in('productid', productIds);

      if (variantsDeleteError) {
        console.error('Error deleting product variants:', variantsDeleteError);
        return NextResponse.json(
          { error: variantsDeleteError.message },
          { status: 500 }
        );
      }

      const { error: productsDeleteError } = await supabase
        .from('products')
        .delete()
        .in('productid', productIds);

      if (productsDeleteError) {
        console.error('Error deleting products for product type:', productsDeleteError);
        return NextResponse.json(
          { error: productsDeleteError.message },
          { status: 500 }
        );
      }
    }

    const { error: linksError } = await supabase
      .from('product_type_properties')
      .delete()
      .eq('producttypeid', id);

    if (linksError) {
      console.error('Error deleting product type properties:', linksError);
      return NextResponse.json(
        { error: linksError.message },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from('product_types')
      .delete()
      .eq('producttypeid', id);

    if (error) {
      console.error('Error deleting product type:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product type deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete product type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




