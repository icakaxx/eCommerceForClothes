import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { apiErrorResponse } from '@/lib/api-error';


// GET - Fetch all active testimonials ordered by sortorder
export async function GET() {
  try {
    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('isactive', true)
      .order('sortorder', { ascending: true });

    if (error) {
      logger.error('Error fetching testimonials:', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error });
    }

    return NextResponse.json({
      success: true,
      testimonials: data || []
    });
  } catch (error) {
    logger.error('Failed to fetch testimonials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new testimonial
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const { imageurl, sortorder, isactive } = body;

    if (!imageurl) {
      return NextResponse.json(
        { error: 'imageurl is required' },
        { status: 400 }
      );
    }

    // If sortorder not provided, get the max sortorder and add 1
    let finalSortOrder = sortorder;
    if (finalSortOrder === undefined || finalSortOrder === null) {
      const { data: existingTestimonials } = await supabase
        .from('testimonials')
        .select('sortorder')
        .order('sortorder', { ascending: false })
        .limit(1)
        .single();

      finalSortOrder = existingTestimonials?.sortorder !== undefined 
        ? (existingTestimonials.sortorder + 1) 
        : 0;
    }

    const { data, error } = await supabase
      .from('testimonials')
      .insert({
        imageurl,
        sortorder: finalSortOrder,
        isactive: isactive !== undefined ? isactive : true
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating testimonial:', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error });
    }

    return NextResponse.json({
      success: true,
      testimonial: data
    });
  } catch (error) {
    logger.error('Failed to create testimonial:', error);
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
  }
}
