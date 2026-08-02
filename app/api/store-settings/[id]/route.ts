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

    const { data, error } = await (supabase as any)
      .from('store_settings')
      .update({
        ...body,
        updatedat: new Date().toISOString()
      })
      .eq('storesettingsid', id)
      .select()
      .single()

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
