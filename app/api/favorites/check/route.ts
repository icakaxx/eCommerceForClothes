import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// POST - Check if a product is favorited by a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, productId } = body

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'User ID and Product ID are required' },
        { status: 400 }
      )
    }

    // Check if favorite exists
    const { data: favorite, error: checkError } = await supabaseAdmin
      .from('favorite_products')
      .select('favoriteid')
      .eq('userid', userId)
      .eq('productid', productId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking favorite:', checkError)
      return NextResponse.json(
        { error: 'Failed to check favorite status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      isFavorited: !!favorite
    })

  } catch (error) {
    console.error('Check favorite API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
