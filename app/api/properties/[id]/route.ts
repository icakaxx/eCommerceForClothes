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




