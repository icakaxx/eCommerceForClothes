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
      brand?: string;
      model?: string;
      color?: string;
      size?: string;
      images?: string[];
    };
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Fetch all orders with their items
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          OrderItemID,
          quantity,
          price,
          createdat,
          productid,
          ProductVariantID,
          product_variants (
            ProductVariantID,
            SKU,
            Price,
            Quantity,
            products (
              ProductID,
              Name,
              product_property_values (
                Value,
                properties (
                  Name
                )
              )
            ),
            product_variant_property_values (
              Value,
              properties (
                Name
              )
            ),
            product_images (
              ImageURL,
              IsPrimary
            )
          )
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
    const processedOrders: OrderWithItems[] = orders.map(order => {
      const orderItems = order.order_items.map((item: any) => {
        let productInfo = {
          name: 'Unknown Product',
          brand: undefined,
          model: undefined,
          color: undefined,
          size: undefined,
          images: []
        };

        if (item.product_variants) {
          const variant = item.product_variants;
          const product = variant.products;

          // Extract brand, model, color from product properties
          const properties = product?.product_property_values || [];
          const variantProperties = variant?.product_variant_property_values || [];

          const allProperties = [...properties, ...variantProperties];

          productInfo = {
            name: product?.Name || 'Unknown Product',
            brand: allProperties.find((p: any) => p.properties?.Name?.toLowerCase() === 'brand')?.Value,
            model: allProperties.find((p: any) => p.properties?.Name?.toLowerCase() === 'model')?.Value,
            color: allProperties.find((p: any) => p.properties?.Name?.toLowerCase() === 'color')?.Value,
            size: allProperties.find((p: any) => p.properties?.Name?.toLowerCase() === 'size')?.Value,
            images: variant.product_images?.filter((img: any) => img.IsPrimary).map((img: any) => img.ImageURL) || []
          };
        } else if (item.productid) {
          // Fallback for items without variants (though this might not work due to schema mismatch)
          productInfo = {
            name: `Product ID: ${item.productid}`,
            brand: undefined,
            model: undefined,
            color: undefined,
            size: undefined,
            images: []
          };
        }

        return {
          OrderItemID: item.OrderItemID,
          quantity: item.quantity,
          price: item.price,
          createdat: item.createdat,
          product: productInfo
        };
      });

      return {
        ...order,
        order_items: orderItems
      };
    });

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
