export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { sendCustomerOrderEmail, sendAdminOrderEmail } from '@/lib/email';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface OrderData {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    telephone: string;
    country: string;
    city: string;
  };
  delivery: {
    type: string;
    notes: string;
  };
  items: Array<{
    id: string | number;
    quantity: number;
    size?: string;
    price?: number;
  }>;
  totals: {
    subtotal: number;
    delivery: number;
    total: number;
  };
}

// Validate stock availability
async function validateStock(items: OrderData['items']): Promise<{ valid: boolean; insufficientStock: any[] }> {
  const supabase = supabaseAdmin;
  const insufficientStock: any[] = [];

  for (const item of items) {
    try {
      // Check product variants first (for size-specific items)
      if (item.size) {
        const { data: variant, error } = await supabase
          .from('product_variants')
          .select('quantity')
          .eq('productvariantid', item.id)
          .single();

        if (error) {
          console.error('Error checking variant stock:', error);
          insufficientStock.push({ id: item.id, requested: item.quantity, available: 0 });
          continue;
        }

        if (!variant || (variant as any).quantity < item.quantity) {
          insufficientStock.push({
            id: item.id,
            requested: item.quantity,
            available: (variant as any)?.quantity || 0
          });
        }
      } else {
        // For products without variants, assume sufficient stock
        // (The products table doesn't have a quantity column in the current schema)
        // In a full implementation, products table should also have quantity column
        console.log(`Skipping stock check for product ${item.id} (no variants)`);
      }
    } catch (error) {
      console.error('Stock validation error:', error);
      insufficientStock.push({ id: item.id, requested: item.quantity, available: 0 });
    }
  }

  return {
    valid: insufficientStock.length === 0,
    insufficientStock
  };
}

// Reduce stock quantities
async function reduceStock(items: OrderData['items']): Promise<void> {
  const supabase = supabaseAdmin;
  for (const item of items) {
    try {
      if (item.size) {
        // Get current variant data
        const { data: variant, error: fetchError } = await supabase
          .from('product_variants')
          .select('quantity')
          .eq('productvariantid', item.id)
          .single();

        if (fetchError || !variant) {
          console.error('Error fetching variant for stock reduction:', fetchError);
          throw new Error(`Failed to fetch variant ${item.id} for stock reduction`);
        }

        // Reduce variant stock
        const { error } = await (supabase as any)
          .from('product_variants')
          .update({ quantity: (variant as any).quantity - item.quantity })
          .eq('productvariantid', item.id);

        if (error) {
          console.error('Error reducing variant stock:', error);
          throw new Error(`Failed to reduce stock for variant ${item.id}`);
        }
      } else {
        // For products without variants, skip stock reduction
        // (The products table doesn't have a quantity column in the current schema)
        // In a full implementation, products table should also have quantity column
        console.log(`Skipping stock reduction for product ${item.id} (no variants)`);
      }
    } catch (error) {
      console.error('Stock reduction error:', error);
      throw error;
    }
  }
}

// Create order record
async function createOrder(orderData: OrderData): Promise<string> {
  const supabase = supabaseAdmin;
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const orderRecord = {
    orderid: orderId,
    customerfirstname: orderData.customer.firstName,
    customerlastname: orderData.customer.lastName,
    customeremail: orderData.customer.email,
    customertelephone: orderData.customer.telephone,
    customercountry: orderData.customer.country,
    customercity: orderData.customer.city,
    deliverytype: orderData.delivery.type,
    deliverynotes: orderData.delivery.notes || null,
    subtotal: orderData.totals.subtotal,
    deliverycost: orderData.totals.delivery,
    total: orderData.totals.total,
    status: 'pending',
    createdat: new Date().toISOString(),
    updatedat: new Date().toISOString()
  };

  // Debug: Log connection details
  console.log('🔍 Order Creation Debug Info:');
  console.log('- Using supabaseAdmin client from @/lib/supabase/admin');
  console.log('- Should be using SUPABASE_SERVICE_ROLE_KEY for service role access');
  console.log('- Environment check:', {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
  });

  // Check what auth context we're running in
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('- Auth context:', {
      hasUser: !!user,
      userId: user?.id,
      userRole: user?.user_metadata?.role,
      authError: authError?.message
    });
  } catch (authCheckError) {
    console.log('- Auth context check failed:', authCheckError);
  }

  const { data: order, error } = await (supabase as any)
    .from('orders')
    .insert(orderRecord)
    .select()
    .single();

  if (error) {
    console.error('❌ Database Error Details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      role: 'Should be service_role, but likely falling back to anon/public key'
    });
    console.error('🔑 Connection Role Analysis:');
    console.error('- If error.code is "42501", it\'s a permission denied error');
    console.error('- This means RLS is blocking the operation');
    console.error('- The client is likely using anon key instead of service role key');
    console.error('- Check: Is SUPABASE_SERVICE_ROLE_KEY set in .env.local?');
    throw new Error(`Failed to create order record: ${error.message} (Code: ${error.code})`);
  }

  // Create order items
  const orderItemsPromises = orderData.items.map(async (item) => {
    let productId = null;
    let productVariantId = null;
    let price = 0;

    // Check if item.id is a variant ID (UUID string) or product ID (number/string)
    if (item.id && typeof item.id === 'string' && item.id.length > 10) {
      // Looks like a UUID variant ID (from cart when size is selected)
      const { data: variant } = await supabase
        .from('product_variants')
        .select('productid, price')
        .eq('productvariantid', item.id)
        .single();

      if (variant) {
        productId = variant.productid;
        productVariantId = item.id;
        price = variant.price || 0;
      }
    } else if (item.id) {
      // Assume it's a product ID (for products without variants)
      productId = item.id;
      // For products without variants, price comes from cart item
      price = item.price || 0;
    }

    return {
      orderid: orderId,
      productid: productId,
      productvariantid: productVariantId, // Use lowercase column name to match schema
      quantity: item.quantity,
      price: price,
      createdat: new Date().toISOString()
    };
  });

  const orderItems = await Promise.all(orderItemsPromises);

  const { error: itemsError } = await (supabase as any)
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    console.error('Order items error details:', {
      message: itemsError.message,
      code: itemsError.code,
      details: itemsError.details,
      hint: itemsError.hint
    });
    throw new Error('Failed to create order items');
  }

  return orderId;
}

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderData = await request.json();

    // Temporarily commented out stock validation
    // const stockValidation = await validateStock(orderData.items);
    // if (!stockValidation.valid) {
    //   return NextResponse.json({
    //     success: false,
    //     error: 'Insufficient stock',
    //     insufficientStock: stockValidation.insufficientStock
    //   }, { status: 400 });
    // }

    // Create order record
    const orderId = await createOrder(orderData);

    // Temporarily commented out stock reduction
    // await reduceStock(orderData.items);

    // Prepare order details for emails
    const orderDetails = {
      orderId,
      customer: orderData.customer,
      delivery: orderData.delivery,
      items: orderData.items.map(item => ({
        id: item.id.toString(),
        name: 'Product', // This should be populated with actual product names
        brand: 'Brand', // This should be populated with actual brand names
        model: 'Model', // This should be populated with actual model names
        color: 'Color', // This should be populated with actual colors
        size: item.size,
        type: undefined,
        price: 0, // This should be calculated
        quantity: item.quantity,
        imageUrl: '/placeholder-image.jpg'
      })),
      totals: orderData.totals,
      orderDate: new Date().toISOString()
    };

    // Send emails (run in parallel)
    const [customerEmailResult, adminEmailResult] = await Promise.allSettled([
      sendCustomerOrderEmail(orderDetails),
      sendAdminOrderEmail(orderDetails)
    ]);

    // Log email results
    if (customerEmailResult.status === 'rejected') {
      console.error('Customer email failed:', customerEmailResult.reason);
    }
    if (adminEmailResult.status === 'rejected') {
      console.error('Admin email failed:', adminEmailResult.reason);
    }

    return NextResponse.json({
      success: true,
      orderId,
      message: 'Order placed successfully'
    });

  } catch (error) {
    console.error('Order processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
