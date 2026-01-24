import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// GET - Get favorite count for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Count favorites for this product
    const { count, error: countError } = await supabaseAdmin
      .from('favorite_products')
      .select('*', { count: 'exact', head: true })
      .eq('productid', productId)

    if (countError) {
      console.error('Error counting favorites:', countError)
      return NextResponse.json(
        { error: 'Failed to get favorite count' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: count || 0
    })

  } catch (error) {
    console.error('Favorite count API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
