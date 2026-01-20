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
        producttypepropertyid,
        propertyid,
        properties (
          propertyid,
          name,
          description,
          datatype,
          createdat,
          updatedat,
          property_values (
            propertyvalueid,
            propertyid,
            value,
            displayorder,
            isactive,
            createdat,
            updatedat
          )
        )
      `)
      .eq('producttypeid', id);

    if (error) {
      console.error('Error fetching product type properties:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Transform the data to include values array properly
    const propertiesWithvalues = (productTypeProperties || []).map((ptp: any) => ({
      ...ptp,
      properties: ptp.properties ? {
        ...ptp.properties,
        values: ptp.properties.property_values
          ?.filter((v: any) => v.isactive !== false)
          ?.sort((a: any, b: any) => a.displayorder - b.displayorder)
          || []
      } : null
    }));

    return NextResponse.json({
      success: true,
      properties: propertiesWithvalues
    });

  } catch (error) {
    console.error('Failed to fetch product type properties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Assign property(ies) to product type
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const body = await request.json();

    // Support both single propertyid (backward compatibility) and array of propertyids
    const { propertyid, propertyids } = body;
    const propertyIds = propertyids || (propertyid ? [propertyid] : []);

    if (!propertyIds || propertyIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: propertyid or propertyids' },
        { status: 400 }
      );
    }

    // Insert all properties at once
    const insertData = propertyIds.map((pid: string) => ({
      producttypeid: id,
      propertyid: pid
    }));

    const { data: productTypeProperties, error } = await supabase
      .from('product_type_properties')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Error assigning properties to product type:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      productTypeProperty: productTypeProperties?.length === 1 ? productTypeProperties[0] : undefined,
      productTypeProperties: productTypeProperties
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
      .eq('producttypeid', id)
      .eq('propertyid', propertyId);

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

