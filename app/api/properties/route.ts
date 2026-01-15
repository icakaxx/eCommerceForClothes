import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Fetch all properties with their values (with fallback for missing table)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_values (
            propertyvalueid,
            value,
            displayorder,
            isactive,
            createdat
          )
        `)
        .order('name', { ascending: true });

      if (error) {
        // If property_values table doesn't exist, fetch properties without values
        console.warn('property_values table not found, falling back to properties only:', error.message);
        const { data: fallbackProperties, error: fallbackError } = await supabase
          .from('properties')
          .select('*')
          .order('name', { ascending: true });

        if (fallbackError) {
          console.error('Error fetching properties:', fallbackError);
          return NextResponse.json(
            { error: fallbackError.message },
            { status: 500 }
          );
        }

        // Add empty values array for compatibility
        const propertiesWithEmptyvalues = (fallbackProperties || []).map(prop => ({
          ...prop,
          values: []
        }));

        return NextResponse.json({
          success: true,
          properties: propertiesWithEmptyvalues
        });
      }

      // Filter out inactive values and sort them
      const propertiesWithvalues = (properties || []).map(prop => ({
        ...prop,
        values: prop.property_values
          ?.filter((v: any) => v.isactive !== false) // Allow undefined (new records) to pass
          ?.sort((a: any, b: any) => a.displayorder - b.displayorder || a.value.localeCompare(b.value))
          || []
      }));

      return NextResponse.json({
        success: true,
        properties: propertiesWithvalues
      });

    } catch (dbError) {
      // Complete fallback - return properties without values if database issues
      console.error('Database error, using minimal fallback:', dbError);
      try {
        const { data: minimalProperties, error: minimalError } = await supabase
          .from('properties')
          .select('*')
          .order('name', { ascending: true });

        if (minimalError) {
          throw minimalError;
        }

        const propertiesWithEmptyvalues = (minimalProperties || []).map(prop => ({
          ...prop,
          values: []
        }));

        return NextResponse.json({
          success: true,
          properties: propertiesWithEmptyvalues
        });
      } catch (minimalError) {
        console.error('Minimal fallback also failed:', minimalError);
        return NextResponse.json(
          { error: 'Database connection issues' },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error('Failed to fetch properties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new property
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    const { name, description, datatype, productTypeIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        name,
        description: description || null,
        datatype: datatype || 'text',
        updatedat: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (Array.isArray(productTypeIds) && productTypeIds.length > 0) {
      const { error: linksError } = await supabase
        .from('product_type_properties')
        .insert(
          productTypeIds.map((producttypeid: string) => ({
            producttypeid,
            propertyid: property.propertyid
          }))
        );

      if (linksError) {
        console.error('Error linking property to product types:', linksError);
        return NextResponse.json(
          { error: linksError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      property
    });

  } catch (error) {
    console.error('Failed to create property:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

