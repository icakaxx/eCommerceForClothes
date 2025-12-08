import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Fetch all product types
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data: productTypes, error } = await supabase
      .from('product_types')
      .select('*')
      .order('Name', { ascending: true });

    if (error) {
      console.error('Error fetching product types:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      productTypes: productTypes || []
    });

  } catch (error) {
    console.error('Failed to fetch product types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new product type
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    const { Name, Code } = body;

    if (!Name || !Code) {
      return NextResponse.json(
        { error: 'Missing required fields: Name, Code' },
        { status: 400 }
      );
    }

    const { data: productType, error } = await supabase
      .from('product_types')
      .insert({
        Name,
        Code,
        UpdatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product type:', error);
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
    console.error('Failed to create product type:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}


