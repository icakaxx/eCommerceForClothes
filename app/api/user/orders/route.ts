import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch user to get email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('userid', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Find customer by email
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('customerid')
      .eq('email', user.email.toLowerCase().trim())
      .single()

    if (customerError || !customer) {
      // User exists but has no orders yet
      return NextResponse.json({
        orders: [],
        count: 0
      })
    }

    // Fetch orders for this customer
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        orderid,
        customerid,
        deliverytype,
        deliverynotes,
        subtotal,
        deliverycost,
        discountamount,
        total,
        status,
        createdat,
        updatedat,
        orderitems (
          orderitemid,
          productid,
          variantid,
          quantity,
          price,
          products (
            productid,
            brand,
            model,
            sku
          ),
          productvariants (
            variantid,
            sku
          )
        )
      `)
      .eq('customerid', customer.customerid)
      .order('createdat', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    // Transform orders to match expected format
    const transformedOrders = (orders || []).map((order: any) => {
      const items = (order.orderitems || []).map((item: any) => {
        const product = item.products || {}
        const variant = item.productvariants || {}
        
        return {
          productId: item.productid,
          variantId: item.variantid,
          name: `${product.brand || ''} ${product.model || ''}`.trim() || 'Product',
          sku: variant.sku || product.sku || '',
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.price * item.quantity
        }
      })

      const totalAmount = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0)

      return {
        orderId: order.orderid,
        orderDate: order.createdat,
        totalAmount: totalAmount,
        discountAmount: order.discountamount || 0,
        deliveryCost: order.deliverycost || 0,
        status: order.status || 'pending',
        deliveryType: order.deliverytype,
        deliveryNotes: order.deliverynotes,
        items: items
      }
    })

    return NextResponse.json({
      orders: transformedOrders,
      count: transformedOrders.length
    })

  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
