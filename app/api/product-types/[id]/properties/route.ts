import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get all properties for a product type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    const { data: productTypeProperties, error } = await supabase
      .from('product_type_properties')
      .select(`
        ProductTypePropertyID,
        PropertyID,
        properties (
          PropertyID,
          Name,
          Description,
          DataType,
          CreatedAt,
          UpdatedAt,
          property_values (
            PropertyValueID,
            PropertyID,
            Value,
            DisplayOrder,
            IsActive,
            CreatedAt,
            UpdatedAt
          )
        )
      `)
      .eq('ProductTypeID', id);

    if (error) {
      console.error('Error fetching product type properties:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Transform the data to include Values array properly
    const propertiesWithValues = (productTypeProperties || []).map((ptp: any) => ({
      ...ptp,
      properties: ptp.properties ? {
        ...ptp.properties,
        Values: ptp.properties.property_values
          ?.filter((v: any) => v.IsActive !== false)
          ?.sort((a: any, b: any) => a.DisplayOrder - b.DisplayOrder)
          || []
      } : null
    }));

    return NextResponse.json({
      success: true,
      properties: propertiesWithValues
    });

  } catch (error) {
    console.error('Failed to fetch product type properties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Assign property to product type
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const body = await request.json();

    const { PropertyID } = body;

    if (!PropertyID) {
      return NextResponse.json(
        { error: 'Missing required field: PropertyID' },
        { status: 400 }
      );
    }

    const { data: productTypeProperty, error } = await supabase
      .from('product_type_properties')
      .insert({
        ProductTypeID: id,
        PropertyID
      })
      .select()
      .single();

    if (error) {
      console.error('Error assigning property to product type:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      productTypeProperty
    });

  } catch (error) {
    console.error('Failed to assign property to product type:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove property from product type
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
      .from('product_type_properties')
      .delete()
      .eq('ProductTypeID', id)
      .eq('PropertyID', propertyId);

    if (error) {
      console.error('Error removing property from product type:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Property removed from product type successfully'
    });

  } catch (error) {
    console.error('Failed to remove property from product type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

