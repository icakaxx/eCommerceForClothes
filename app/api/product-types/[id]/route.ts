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
          ProductTypePropertyID,
          PropertyID,
          properties (
            PropertyID,
            Name,
            Description,
            DataType
          )
        )
      `)
      .eq('ProductTypeID', id)
      .single();

    if (productTypeError || !productType) {
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

    const { Name, Code } = body;

    const { data: productType, error } = await supabase
      .from('product_types')
      .update({
        Name,
        Code,
        UpdatedAt: new Date().toISOString()
      })
      .eq('ProductTypeID', id)
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

    const { error } = await supabase
      .from('product_types')
      .delete()
      .eq('ProductTypeID', id);

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

