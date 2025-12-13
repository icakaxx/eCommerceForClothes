import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin';

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
      console.error('Error updating store settings:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      settings: data
    })

  } catch (error) {
    console.error('Failed to update store settings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
