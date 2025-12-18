import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin';

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
      console.error('Error fetching store settings:', error)
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
    console.error('Failed to fetch store settings:', error)
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
      console.error('Error creating store settings:', error)
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
    console.error('Failed to create store settings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}



