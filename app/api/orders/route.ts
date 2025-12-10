import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendCustomerOrderEmail, sendAdminOrderEmail } from '@/lib/email';

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
  }>;
  totals: {
    subtotal: number;
    delivery: number;
    total: number;
  };
}

// Validate stock availability
async function validateStock(items: OrderData['items']): Promise<{ valid: boolean; insufficientStock: any[] }> {
  const insufficientStock: any[] = [];

  for (const item of items) {
    try {
      // Check product variants first (for size-specific items)
      if (item.size) {
        const { data: variant, error } = await supabase
          .from('product_variants')
          .select('"Quantity"')
          .eq('"ProductVariantID"', item.id)
          .single();

        if (error) {
          console.error('Error checking variant stock:', error);
          insufficientStock.push({ id: item.id, requested: item.quantity, available: 0 });
          continue;
        }

        if (!variant || variant.Quantity < item.quantity) {
          insufficientStock.push({
            id: item.id,
            requested: item.quantity,
            available: variant?.Quantity || 0
          });
        }
      } else {
        // For products without variants, assume sufficient stock
        // (The products table doesn't have a Quantity column in the current schema)
        // In a full implementation, products table should also have Quantity column
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
  for (const item of items) {
    try {
      if (item.size) {
        // Reduce variant stock
        const { error } = await supabase.rpc('reduce_variant_stock', {
          variant_id: item.id,
          reduce_by: item.quantity
        });

        if (error) {
          console.error('Error reducing variant stock:', error);
          throw new Error(`Failed to reduce stock for variant ${item.id}`);
        }
      } else {
        // For products without variants, skip stock reduction
        // (The products table doesn't have a Quantity column in the current schema)
        // In a full implementation, products table should also have Quantity column
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

  const { data: order, error } = await supabase
    .from('orders')
    .insert(orderRecord)
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order record');
  }

  // Create order items
  const orderItems = orderData.items.map(item => ({
    orderid: orderId,
    productid: typeof item.id === 'string' ? parseInt(item.id) : item.id,
    productvariantid: item.size ? item.id : null,
    quantity: item.quantity,
    price: 0, // This should be calculated from the product
    createdat: new Date().toISOString()
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', error);
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
