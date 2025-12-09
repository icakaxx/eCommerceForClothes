import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get all property values for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    const { data: productPropertyValues, error } = await supabase
      .from('product_property_values')
      .select(`
        ProductPropertyValueID,
        PropertyID,
        Value,
        properties (
          PropertyID,
          Name,
          Description,
          DataType
        )
      `)
      .eq('ProductID', id);

    if (error) {
      console.error('Error fetching product property values:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      propertyValues: productPropertyValues || []
    });

  } catch (error) {
    console.error('Failed to fetch product property values:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Set property value for a product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const body = await request.json();

    const { PropertyID, Value } = body;

    if (!PropertyID || Value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: PropertyID, Value' },
        { status: 400 }
      );
    }

    // Use upsert to update if exists, insert if not
    const { data: productPropertyValue, error } = await supabase
      .from('product_property_values')
      .upsert({
        ProductID: id,
        PropertyID,
        Value: String(Value),
        UpdatedAt: new Date().toISOString()
      }, {
        onConflict: 'ProductID,PropertyID'
      })
      .select()
      .single();

    if (error) {
      console.error('Error setting product property value:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      productPropertyValue
    });

  } catch (error) {
    console.error('Failed to set product property value:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove property value from product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Missing required parameter: propertyId' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('product_property_values')
      .delete()
      .eq('ProductID', id)
      .eq('PropertyID', propertyId);

    if (error) {
      console.error('Error removing product property value:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product property value removed successfully'
    });

  } catch (error) {
    console.error('Failed to remove product property value:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




