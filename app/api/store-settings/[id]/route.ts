import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { apiErrorResponse } from '@/lib/api-error';


// PUT - Update store settings by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json()
    const { id } = await params

    const payload = {
      ...body,
      updatedat: new Date().toISOString()
    };

    let { data, error } = await (supabase as any)
      .from('store_settings')
      .update(payload)
      .eq('storesettingsid', id)
      .select()
      .single()

    if (
      error &&
      /hero_jackets_productid|hero_formal_productid|hero_jackets_productids|hero_formal_productids/i.test(
        String(error.message ?? '')
      )
    ) {
      const fallback = { ...payload };
      delete fallback.hero_jackets_productid;
      delete fallback.hero_formal_productid;
      delete fallback.hero_jackets_productids;
      delete fallback.hero_formal_productids;
      const retry = await (supabase as any)
        .from('store_settings')
        .update(fallback)
        .eq('storesettingsid', id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      logger.error('Error updating store settings:', error)
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error })
    }

    return NextResponse.json({
      success: true,
      settings: data
    })

  } catch (error) {
    logger.error('Failed to update store settings:', error)
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error })
  }
}
