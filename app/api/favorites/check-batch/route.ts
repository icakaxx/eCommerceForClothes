import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// POST - Check if multiple products are favorited by a user (batch)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, productIds } = body

    if (!userId || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'User ID and Product IDs array are required' },
        { status: 400 }
      )
    }

    // Check if favorites exist for all products at once
    const { data: favorites, error: checkError } = await supabaseAdmin
      .from('favorite_products')
      .select('productid')
      .eq('userid', userId)
      .in('productid', productIds)

    if (checkError) {
      console.error('Error checking favorites:', checkError)
      return NextResponse.json(
        { error: 'Failed to check favorite status' },
        { status: 500 }
      )
    }

    // Create a Set of favorited product IDs for quick lookup
    const favoritedProductIds = new Set(
      (favorites || []).map((f: any) => String(f.productid))
    )

    // Build response object with favorite status for each product
    const favoriteStatus: Record<string, boolean> = {}
    productIds.forEach((productId: string) => {
      favoriteStatus[String(productId)] = favoritedProductIds.has(String(productId))
    })

    return NextResponse.json({
      success: true,
      favorites: favoriteStatus
    })

  } catch (error) {
    console.error('Check favorites batch API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
