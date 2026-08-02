import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { apiErrorResponse } from '@/lib/api-error';


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
      logger.error('Error updating testimonial:', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error });
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
    logger.error('Failed to update testimonial:', error);
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
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
      logger.error('Error deleting testimonial:', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error });
    }

    return NextResponse.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete testimonial:', error);
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
  }
}
