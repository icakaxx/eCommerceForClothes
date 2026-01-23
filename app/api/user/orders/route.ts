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
      console.error('User not found:', { userId, error: userError })
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Normalize email for matching (lowercase and trim)
    const normalizedEmail = (user.email || '').toLowerCase().trim()

    if (!normalizedEmail) {
      // User has no email
      console.log('User has no email:', { userId })
      return NextResponse.json({
        orders: [],
        count: 0
      })
    }

    // Find customer by email (case-insensitive match)
    // Try exact match first
    let { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('customerid, email')
      .eq('email', normalizedEmail)
      .single()

    // If not found, try case-insensitive search
    if (customerError || !customer) {
      const { data: customers, error: searchError } = await supabaseAdmin
        .from('customers')
        .select('customerid, email')
      
      if (!searchError && customers && customers.length > 0) {
        // Find customer with matching email (case-insensitive)
        customer = customers.find(c => 
          c.email && c.email.toLowerCase().trim() === normalizedEmail
        ) || null
        // Reset customerError if we found a customer, otherwise keep the original error
        if (customer) {
          customerError = null
        }
      }
    }

    if (customerError || !customer) {
      // User exists but has no customer record (no orders yet)
      console.log('No customer found for user:', { userId, email: normalizedEmail })
      return NextResponse.json({
        orders: [],
        count: 0
      })
    }

    console.log('Found customer:', { customerId: customer.customerid, email: customer.email })

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
        order_items (
          orderitemid,
          productid,
          productvariantid,
          quantity,
          price,
          products (
            productid,
            name,
            sku
          ),
          product_variants (
            productvariantid,
            sku,
            product_variant_property_values (
              value,
              properties!inner (
                name
              )
            )
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
      const items = (order.order_items || []).map((item: any) => {
        const product = item.products || {}
        const variant = item.product_variants || {}
        
        // Use product name, fallback to SKU or 'Product'
        const productName = product.name || variant.sku || product.sku || 'Product'
        
        // Extract property values from variant
        const properties: Record<string, string> = {}
        if (variant.product_variant_property_values && Array.isArray(variant.product_variant_property_values)) {
          variant.product_variant_property_values.forEach((pvv: any) => {
            const propName = pvv.properties?.name
            const value = pvv.value
            if (propName && value) {
              properties[propName] = value
            }
          })
        }
        
        return {
          productId: item.productid,
          variantId: item.productvariantid,
          name: productName,
          sku: variant.sku || product.sku || '',
          properties: properties,
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
