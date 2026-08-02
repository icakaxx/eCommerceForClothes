import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { apiErrorResponse } from '@/lib/api-error';


// GET - Get all property values for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    const { data: productPropertyvalues, error } = await supabase
      .from('product_property_values')
      .select(`
        productpropertyvalueid,
        propertyid,
        value,
        properties (
          propertyid,
          name,
          description,
          datatype
        )
      `)
      .eq('productid', id);

    if (error) {
      logger.error('Error fetching product property values:', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error });
    }

    return NextResponse.json({
      success: true,
      propertyvalues: productPropertyvalues || []
    });

  } catch (error) {
    logger.error('Failed to fetch product property values:', error);
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

    const { propertyid, value } = body;

    if (!propertyid || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyid, value' },
        { status: 400 }
      );
    }

    // Use upsert to update if exists, insert if not
    const { data: productPropertyvalue, error } = await supabase
      .from('product_property_values')
      .upsert({
        productid: id,
        propertyid,
        value: String(value),
        updatedat: new Date().toISOString()
      }, {
        onConflict: 'productid,propertyid'
      })
      .select()
      .single();

    if (error) {
      logger.error('Error setting product property value:', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error });
    }

    return NextResponse.json({
      success: true,
      productPropertyvalue
    });

  } catch (error) {
    logger.error('Failed to set product property value:', error);
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
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
      .eq('productid', id)
      .eq('propertyid', propertyId);

    if (error) {
      logger.error('Error removing product property value:', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error });
    }

    return NextResponse.json({
      success: true,
      message: 'Product property value removed successfully'
    });

  } catch (error) {
    logger.error('Failed to remove product property value:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




