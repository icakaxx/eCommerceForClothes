import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { apiErrorResponse } from '@/lib/api-error';


// GET - Fetch all RF product types (main categories)
export async function GET() {
  try {
    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from('rfproducttype')
      .select('*')
      .order('rfproducttypeid', { ascending: true });

    if (error) {
      logger.error('Error fetching RF product types:', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error });
    }

    return NextResponse.json({
      success: true,
      rfProductTypes: data
    });

  } catch (error) {
    logger.error('Failed to fetch RF product types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}









