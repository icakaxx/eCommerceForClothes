import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getContactEmail } from '@/lib/mail';
import { logger } from '@/lib/logger';
import { apiErrorResponse } from '@/lib/api-error';


function withPublicContactEmail<T extends { email?: string | null } | null>(settings: T): T {
  if (!settings) {
    return settings;
  }

  const publicEmail = getContactEmail();
  if (!publicEmail || publicEmail === 'contact@store.com') {
    return settings;
  }

  return { ...settings, email: publicEmail };
}

// GET - Fetch store settings
export async function GET() {
  try {
    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      logger.error('Error fetching store settings:', error)
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error })
    }

    return NextResponse.json({
      success: true,
      settings: withPublicContactEmail(data)
    })

  } catch (error) {
    logger.error('Failed to fetch store settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create default store settings (if none exist)
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json()

    const { data, error } = await supabase
      .from('store_settings')
      .insert(body)
      .select()
      .single()

    if (error) {
      logger.error('Error creating store settings:', error)
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error })
    }

    return NextResponse.json({
      success: true,
      settings: data
    })

  } catch (error) {
    logger.error('Failed to create store settings:', error)
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error })
  }
}









