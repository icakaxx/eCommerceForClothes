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
    econtOfficeId?: string;
    street?: string;
    streetNumber?: string;
    entrance?: string;
    floor?: string;
    apartment?: string;
  };
  items: Array<{
    id: string | number;
    quantity: number;
    size?: string;
    price?: number;
  }>;
  totals: {
    subtotal: number;
    discount?: number;
    delivery: number;
    total: number;
  };
  discount?: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
  } | null;
}

// Validate stock availability
async function validateStock(items: OrderData['items']): Promise<{ valid: boolean; insufficientStock: any[] }> {
  const supabase = supabaseAdmin;
  const insufficientStock: any[] = [];

  for (const item of items) {
    try {
      // Check if item.id is a variant ID (UUID string with length > 10)
      // This matches the logic in createOrder function
      const isVariantId = item.id && typeof item.id === 'string' && item.id.length > 10;
      
      if (isVariantId) {
        // This is a variant - use item.id directly as the variant ID
        const variantId = item.id;

        // Get variant data including trackquantity and quantity
        const { data: variant, error } = await supabase
          .from('product_variants')
          .select('quantity, trackquantity, isvisible')
          .eq('productvariantid', variantId)
          .single();

        if (error || !variant) {
          console.error('Error checking variant stock:', error);
          // If variant not found, assume insufficient stock
          insufficientStock.push({ 
            id: item.id, 
            variantId: variantId,
            requested: item.quantity, 
            available: 0,
            reason: 'Variant not found'
          });
          continue;
        }

        // Only check stock if trackquantity is enabled and variant is visible
        if ((variant as any).trackquantity !== false && (variant as any).isvisible !== false) {
          const availableQuantity = (variant as any).quantity || 0;
          
          if (availableQuantity < item.quantity) {
            insufficientStock.push({
              id: item.id,
              variantId: variantId,
              requested: item.quantity,
              available: availableQuantity,
              reason: 'Insufficient stock'
            });
          }
        } else {
          // If trackquantity is disabled or variant is not visible, assume sufficient stock
          console.log(`Skipping stock check for variant ${variantId} - trackquantity disabled or not visible`);
        }
      } else {
        // For products without variants, assume sufficient stock
        // (The products table doesn't have a quantity column in the current schema)
        console.log(`Skipping stock check for product ${item.id} (no variant ID)`);
      }
    } catch (error) {
      console.error('Stock validation error:', error);
      insufficientStock.push({ 
        id: item.id, 
        requested: item.quantity, 
        available: 0,
        reason: 'Validation error'
      });
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
      // Check if item.id is a variant ID (UUID string with length > 10)
      // This matches the logic in createOrder function
      const isVariantId = item.id && typeof item.id === 'string' && item.id.length > 10;
      
      if (isVariantId) {
        // This is a variant - use item.id directly as the variant ID
        const variantId = item.id;

        console.log(`🔍 Attempting to reduce stock for variant ID: ${variantId}, quantity: ${item.quantity}`);

        // Get current variant data including trackquantity flag
        const { data: variant, error: fetchError } = await supabase
          .from('product_variants')
          .select('quantity, trackquantity, productvariantid')
          .eq('productvariantid', variantId)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching variant for stock reduction:', {
            error: fetchError,
            variantId: variantId,
            errorCode: fetchError.code,
            errorMessage: fetchError.message
          });
          throw new Error(`Failed to fetch variant ${variantId} for stock reduction: ${fetchError.message}`);
        }

        if (!variant) {
          console.error(`❌ Variant ${variantId} not found in database`);
          throw new Error(`Variant ${variantId} not found`);
        }

        console.log(`✅ Found variant:`, {
          productvariantid: variant.productvariantid,
          currentQuantity: variant.quantity,
          trackquantity: variant.trackquantity
        });

        // Only reduce stock if trackquantity is enabled (default is true, so check for explicit false)
        const trackQuantity = variant.trackquantity !== false && variant.trackquantity !== null;
        
        if (trackQuantity) {
          const currentQuantity = Number(variant.quantity) || 0;
          const newQuantity = Math.max(0, currentQuantity - item.quantity); // Prevent negative quantities

          console.log(`📦 Reducing stock for variant ${variantId}: ${currentQuantity} -> ${newQuantity} (ordered: ${item.quantity})`);

          // Reduce variant stock - ensure we use the correct column name from schema
          const { error: updateError } = await supabase
            .from('product_variants')
            .update({ 
              quantity: newQuantity,
              updatedat: new Date().toISOString()
            })
            .eq('productvariantid', variantId);

          if (updateError) {
            console.error('❌ Error reducing variant stock:', {
              error: updateError,
              variantId: variantId,
              errorCode: updateError.code,
              errorMessage: updateError.message
            });
            throw new Error(`Failed to reduce stock for variant ${variantId}: ${updateError.message}`);
          }

          console.log(`✅ Successfully reduced stock for variant ${variantId} from ${currentQuantity} to ${newQuantity}`);
        } else {
          console.log(`⚠️ Skipping stock reduction for variant ${variantId} - trackquantity is disabled (trackquantity: ${variant.trackquantity})`);
        }
      } else {
        // For products without variants, skip stock reduction
        // (The products table doesn't have a quantity column in the current schema)
        console.log(`Skipping stock reduction for product ${item.id} (no variant ID)`);
      }
    } catch (error) {
      console.error('Stock reduction error:', error);
      throw error;
    }
  }
}

// Get or create customer
async function getOrCreateCustomer(customerData: OrderData['customer']): Promise<string> {
  const supabase = supabaseAdmin;

  // Check if customer exists by email
  const { data: existingCustomer, error: fetchError } = await supabase
    .from('customers')
    .select('customerid')
    .eq('email', customerData.email)
    .single();

  if (existingCustomer && !fetchError) {
    // Update customer information
    await supabase
      .from('customers')
      .update({
        firstname: customerData.firstName,
        lastname: customerData.lastName,
        telephone: customerData.telephone,
        country: customerData.country,
        city: customerData.city,
        updatedat: new Date().toISOString()
      })
      .eq('customerid', existingCustomer.customerid);

    return existingCustomer.customerid;
  }

  // Create new customer
  const { data: newCustomer, error: createError } = await supabase
    .from('customers')
    .insert({
      firstname: customerData.firstName,
      lastname: customerData.lastName,
      email: customerData.email,
      telephone: customerData.telephone,
      country: customerData.country,
      city: customerData.city
    })
    .select('customerid')
    .single();

  if (createError || !newCustomer) {
    console.error('Failed to create customer:', createError);
    throw new Error('Failed to create customer');
  }

  return newCustomer.customerid;
}

// Create order record
async function createOrder(orderData: OrderData): Promise<string> {
  const supabase = supabaseAdmin;
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Get or create customer first
  const customerId = await getOrCreateCustomer(orderData.customer);

  const orderRecord = {
    orderid: orderId,
    customerid: customerId,
    deliverytype: orderData.delivery.type,
    deliverynotes: orderData.delivery.notes || null,
    econtoffice: orderData.delivery.econtOfficeId || null,
    deliverystreet: orderData.delivery.street || null,
    deliverystreetnumber: orderData.delivery.streetNumber || null,
    deliveryentrance: orderData.delivery.entrance || null,
    deliveryfloor: orderData.delivery.floor || null,
    deliveryapartment: orderData.delivery.apartment || null,
    subtotal: orderData.totals.subtotal,
    deliverycost: orderData.totals.delivery,
    total: orderData.totals.total,
    discountcode: orderData.discount?.code || null,
    discounttype: orderData.discount?.type || null,
    discountvalue: orderData.discount?.value || null,
    discountamount: orderData.discount?.amount || 0,
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

    // Validate stock availability before creating order
    const stockValidation = await validateStock(orderData.items);
    if (!stockValidation.valid) {
      console.error('❌ Stock validation failed:', stockValidation.insufficientStock);
      return NextResponse.json({
        success: false,
        error: 'Insufficient stock',
        insufficientStock: stockValidation.insufficientStock
      }, { status: 400 });
    }

    // Create order record
    const orderId = await createOrder(orderData);

    // Reduce stock quantities after order is successfully created
    await reduceStock(orderData.items);

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
