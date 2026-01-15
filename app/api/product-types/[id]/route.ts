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

    const { error: productsError } = await supabase
      .from('products')
      .update({ isdeleted: true, updatedat: new Date().toISOString() })
      .eq('producttypeid', id);

    if (productsError) {
      console.error('Error deleting products for product type:', productsError);
      return NextResponse.json(
        { error: productsError.message },
        { status: 500 }
      );
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




