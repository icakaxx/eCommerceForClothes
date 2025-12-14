export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface OrderWithItems {
  orderid: string;
  customerfirstname: string;
  customerlastname: string;
  customeremail: string;
  customertelephone: string;
  customercountry: string;
  customercity: string;
  deliverytype: string;
  deliverynotes: string | null;
  subtotal: number;
  deliverycost: number;
  total: number;
  status: string;
  createdat: string;
  updatedat: string;
  order_items: Array<{
    OrderItemID: string;
    quantity: number;
    price: number;
    createdat: string;
    product?: {
      name: string;
      brand: string | undefined;
      model: string | undefined;
      color: string | undefined;
      size: string | undefined;
      images?: string[];
    };
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Fetch all orders with their items (simplified)
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          orderitemid,
          quantity,
          price,
          createdat,
          productid,
          productvariantid
        )
      `)
      .order('createdat', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch orders'
      }, { status: 500 });
    }

    // Process the orders data to format it nicely
    const processedOrdersPromises = orders.map(async (order) => {
      const orderItems = await Promise.all(order.order_items.map(async (item: any) => {
        let productInfo = {
          name: 'Unknown Product',
          brand: undefined as string | undefined,
          model: undefined as string | undefined,
          color: undefined as string | undefined,
          size: undefined as string | undefined,
          images: []
        };

        // Fetch product and variant details separately
        try {
          if (item.productvariantid) {
            // Get variant details with product info
            const { data: variant } = await supabaseAdmin
              .from('product_variants')
              .select(`
                sku,
                productid,
                products (
                  name
                ),
                product_variant_property_values (
                  value,
                  properties (
                    name
                  )
                )
              `)
              .eq('productvariantid', item.productvariantid)
              .single();

            if (variant) {
              // Set product name
              const products = variant.products as any;
              const productName = Array.isArray(products)
                ? products[0]?.name
                : products?.name;
              productInfo.name = productName || variant.sku || 'Unknown Product';

              // Extract property values
              if (variant.product_variant_property_values) {
                variant.product_variant_property_values.forEach((pvv: any) => {
                  const propName = pvv.properties?.name?.toLowerCase();
                  const value = pvv.value;
                  // Handle both English and Bulgarian property names
                  if (propName?.includes('color') || propName?.includes('цвят') || propName === 'цвят') {
                    productInfo.color = value;
                  } else if (propName?.includes('size') || propName?.includes('размер') || propName === 'размер') {
                    productInfo.size = value;
                  } else if (propName?.includes('brand') || propName?.includes('марка') || propName === 'марка') {
                    productInfo.brand = value;
                  } else if (propName?.includes('model') || propName?.includes('модел') || propName === 'модел') {
                    productInfo.model = value;
                  }
                });
              }
            }
          } else if (item.productid) {
            // Get product details directly
            const { data: product } = await supabaseAdmin
              .from('products')
              .select('name')
              .eq('productid', item.productid)
              .single();

            if (product) {
              productInfo.name = product.name || 'Unknown Product';
            }
          }
        } catch (error) {
          console.error('Error fetching product details for item:', item, error);
          // Keep default productInfo
        }

        return {
          OrderItemID: item.orderitemid,
          quantity: item.quantity,
          price: item.price,
          createdat: item.createdat,
          productvariantid: item.productvariantid, // Debug: include variant ID
          product: productInfo
        };
      }));

      return {
        ...order,
        order_items: orderItems
      };
    });

    const processedOrders: OrderWithItems[] = await Promise.all(processedOrdersPromises);

    return NextResponse.json({
      success: true,
      orders: processedOrders
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
