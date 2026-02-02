import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// PUT - Update testimonial
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseAdmin;
    const { id } = await params;
    const body = await request.json();

    const { imageurl, sortorder, isactive } = body;

    const updateData: any = {
      updatedat: new Date().toISOString()
    };

    if (imageurl !== undefined) updateData.imageurl = imageurl;
    if (sortorder !== undefined) updateData.sortorder = sortorder;
    if (isactive !== undefined) updateData.isactive = isactive;

    const { data, error } = await supabase
      .from('testimonials')
      .update(updateData)
      .eq('testimonialid', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating testimonial:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      testimonial: data
    });
  } catch (error) {
    console.error('Failed to update testimonial:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete testimonial
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseAdmin;
    const { id } = await params;

    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('testimonialid', id);

    if (error) {
      console.error('Error deleting testimonial:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete testimonial:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
