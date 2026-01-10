export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendOrderStatusEmail } from '@/lib/email';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Status is required'
        },
        { status: 400 }
      );
    }

    // Valid statuses
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    const normalizedStatus = status.toLowerCase();
    if (!validStatuses.includes(normalizedStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Fetch order details with customer and items before updating
    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customers (
          customerid,
          firstname,
          lastname,
          email,
          telephone,
          country,
          city
        ),
        order_items (
          orderitemid,
          quantity,
          price,
          productid,
          productvariantid
        )
      `)
      .eq('orderid', id)
      .single();

    if (fetchError || !existingOrder) {
      console.error('Error fetching order:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      );
    }

    // Update the order status
    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update({
        status: normalizedStatus,
        updatedat: new Date().toISOString()
      })
      .eq('orderid', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update order'
        },
        { status: 500 }
      );
    }

    // Send email for status changes (excluding 'pending' and initial creation)
    if (normalizedStatus !== 'pending') {
      try {
        // Fetch product details for each item
        const customer = Array.isArray(existingOrder.customers) 
          ? existingOrder.customers[0] 
          : existingOrder.customers;

        if (customer) {
          const itemsWithDetails = await Promise.all(
            (existingOrder.order_items || []).map(async (orderItem: any) => {
              let productInfo = {
                name: 'Unknown Product',
                brand: '',
                model: '',
                color: '',
                size: '',
                type: undefined as string | undefined,
                imageUrl: '/placeholder-image.jpg'
              };

              try {
                if (orderItem.productvariantid) {
                  // Get variant details with product info
                  const { data: variant } = await supabaseAdmin
                    .from('product_variants')
                    .select(`
                      sku,
                      productid,
                      price,
                      products!inner (
                        name
                      ),
                      product_variant_property_values (
                        value,
                        properties!inner (
                          name
                        )
                      )
                    `)
                    .eq('productvariantid', orderItem.productvariantid)
                    .single();

                  if (variant) {
                    const productData = variant.products;
                    productInfo.name = Array.isArray(productData)
                      ? productData[0]?.name || variant.sku || 'Unknown Product'
                      : (productData as any)?.name || variant.sku || 'Unknown Product';

                    // Extract property values
                    if (variant.product_variant_property_values && Array.isArray(variant.product_variant_property_values)) {
                      variant.product_variant_property_values.forEach((pvv: any) => {
                        const propName = pvv.properties?.name?.toLowerCase() || '';
                        const value = pvv.value || '';
                        
                        if (propName.includes('color') || propName.includes('colour') || propName.includes('цвят')) {
                          productInfo.color = value;
                        } else if (propName.includes('size') || propName.includes('размер')) {
                          productInfo.size = value;
                        } else if (propName.includes('brand') || propName.includes('марка')) {
                          productInfo.brand = value;
                        } else if (propName.includes('model') || propName.includes('модел')) {
                          productInfo.model = value;
                        } else if (propName.includes('type') || propName.includes('тип')) {
                          productInfo.type = value;
                        }
                      });
                    }

                    // Parse name to extract brand/model if properties not available
                    if (!productInfo.brand && !productInfo.model) {
                      const nameParts = productInfo.name.split(' ');
                      productInfo.brand = nameParts[0] || '';
                      productInfo.model = nameParts.slice(1).join(' ') || productInfo.name;
                    }
                  }
                } else if (orderItem.productid) {
                  // Get product details directly
                  const { data: product } = await supabaseAdmin
                    .from('products')
                    .select('name')
                    .eq('productid', orderItem.productid)
                    .single();

                  if (product) {
                    productInfo.name = product.name || 'Unknown Product';
                    const nameParts = productInfo.name.split(' ');
                    productInfo.brand = nameParts[0] || '';
                    productInfo.model = nameParts.slice(1).join(' ') || productInfo.name;
                  }
                }
              } catch (error) {
                console.error('Error fetching product details for email:', error);
              }

              return {
                id: orderItem.productvariantid || orderItem.productid || '',
                name: productInfo.name,
                brand: productInfo.brand || 'Unknown',
                model: productInfo.model || productInfo.name,
                color: productInfo.color || '',
                size: productInfo.size || '',
                type: productInfo.type,
                price: orderItem.price || 0,
                quantity: orderItem.quantity,
                imageUrl: productInfo.imageUrl
              };
            })
          );

          // Fetch store settings to get language
          const { data: storeSettings } = await supabaseAdmin
            .from('store_settings')
            .select('language')
            .limit(1)
            .single();

          const language = (storeSettings?.language === 'bg' || storeSettings?.language === 'en') ? storeSettings.language : 'en';

          // Prepare order details for email
          const orderDetails = {
            orderId: id,
            customer: {
              firstName: customer.firstname || '',
              lastName: customer.lastname || '',
              email: customer.email || '',
              telephone: customer.telephone || '',
              country: customer.country || '',
              city: customer.city || ''
            },
            delivery: {
              type: existingOrder.deliverytype || 'office',
              notes: existingOrder.deliverynotes || '',
              street: existingOrder.deliverystreet || undefined,
              streetNumber: existingOrder.deliverystreetnumber || undefined,
              entrance: existingOrder.deliveryentrance || undefined,
              floor: existingOrder.deliveryfloor || undefined,
              apartment: existingOrder.deliveryapartment || undefined,
              econtOfficeId: existingOrder.econtoffice || undefined
            },
            items: itemsWithDetails,
            totals: {
              subtotal: existingOrder.subtotal || 0,
              delivery: existingOrder.deliverycost || 0,
              total: existingOrder.total || 0
            },
            orderDate: existingOrder.createdat || new Date().toISOString()
          };

          // Send email notification to customer (non-blocking)
          // The email service handles 'shipped' -> 'dispatched' mapping internally
          const emailStatus = normalizedStatus as 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
          sendOrderStatusEmail(orderDetails, emailStatus, language).catch((emailError) => {
            console.error('Failed to send status update email:', emailError);
            // Don't fail the request if email fails
          });
        }
      } catch (emailError) {
        console.error('Error preparing email notification:', emailError);
        // Continue even if email preparation fails
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}










