export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    // Fetch orders
    let query = supabaseAdmin
      .from('orders')
      .select('*')
      .order('createdat', { ascending: false });

    if (period !== 'all') {
      query = query.gte('createdat', startDate.toISOString());
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch analytics data'
      }, { status: 500 });
    }

    const ordersList = orders || [];

    // Calculate totals
    const total_sales = ordersList.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const total_orders = ordersList.length;
    const average_order_value = total_orders > 0 ? total_sales / total_orders : 0;

    // Get unique customers
    const uniqueCustomers = new Set(ordersList.map(order => order.customeremail));
    const total_customers = uniqueCustomers.size;

    // Sales by day
    const salesByDayMap = new Map<string, { sales: number; orders: number }>();
    ordersList.forEach(order => {
      const date = new Date(order.createdat).toISOString().split('T')[0];
      if (salesByDayMap.has(date)) {
        const day = salesByDayMap.get(date)!;
        day.sales += parseFloat(order.total);
        day.orders += 1;
      } else {
        salesByDayMap.set(date, {
          sales: parseFloat(order.total),
          orders: 1
        });
      }
    });

    const sales_by_day = Array.from(salesByDayMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Sales by status
    const salesByStatusMap = new Map<string, { count: number; revenue: number }>();
    ordersList.forEach(order => {
      const status = order.status || 'pending';
      if (salesByStatusMap.has(status)) {
        const statusData = salesByStatusMap.get(status)!;
        statusData.count += 1;
        statusData.revenue += parseFloat(order.total);
      } else {
        salesByStatusMap.set(status, {
          count: 1,
          revenue: parseFloat(order.total)
        });
      }
    });

    const sales_by_status = Array.from(salesByStatusMap.entries())
      .map(([status, data]) => ({ status, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // Fetch order items for top products
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .in('orderid', ordersList.map(o => o.orderid));

    // Top products - group by variant ID
    const productMap = new Map<string, { quantity: number; revenue: number; variantId: string; productId?: string }>();
    orderItems?.forEach(item => {
      const key = item.productvariantid || item.productid || 'unknown';
      if (productMap.has(key)) {
        const product = productMap.get(key)!;
        product.quantity += item.quantity;
        product.revenue += item.quantity * parseFloat(item.price);
      } else {
        productMap.set(key, {
          quantity: item.quantity,
          revenue: item.quantity * parseFloat(item.price),
          variantId: item.productvariantid || '',
          productId: item.productid || undefined
        });
      }
    });

    // Fetch product and variant information for top products
    // Extract variant IDs (keys that have a variantId stored) and product IDs (keys that don't have variantId but have productId)
    const variantIds: string[] = [];
    const productIds: string[] = [];
    
    productMap.forEach((data, key) => {
      if (key === 'unknown') return;
      if (data.variantId) {
        variantIds.push(data.variantId);
      } else if (data.productId) {
        productIds.push(data.productId);
      } else {
        // If key itself might be a variant ID or product ID, try both
        variantIds.push(key);
      }
    });
    
    // Remove duplicates
    const uniqueVariantIds = Array.from(new Set(variantIds));
    const uniqueProductIds = Array.from(new Set(productIds));

    // Fetch variants with product info and property values
    const variantInfoMap = new Map<string, { productName: string; characteristics: string }>();
    const productInfoMap = new Map<string, string>();
    
    // Fetch product names for products without variants
    if (uniqueProductIds.length > 0) {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('productid, name')
        .in('productid', uniqueProductIds);

      products?.forEach((product: any) => {
        productInfoMap.set(product.productid, product.name || 'Unknown Product');
      });
    }
    
    if (uniqueVariantIds.length > 0) {
      const { data: variants } = await supabaseAdmin
        .from('product_variants')
        .select(`
          productvariantid,
          productid,
          products!inner (
            productid,
            name
          )
        `)
        .in('productvariantid', uniqueVariantIds);

      // Fetch property values for all variants
      const { data: propertyValues } = await supabaseAdmin
        .from('product_variant_property_values')
        .select(`
          productvariantid,
          value,
          properties!inner (
            propertyid,
            name
          )
        `)
        .in('productvariantid', uniqueVariantIds);

      // Build variant info map
      variants?.forEach((variant: any) => {
        const variantId = variant.productvariantid;
        const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
        const productName = product?.name || 'Unknown Product';

        // Get characteristics for this variant
        const variantProps = propertyValues?.filter((pv: any) => pv.productvariantid === variantId) || [];
        const characteristics = variantProps
          .map((pv: any) => {
            const prop = Array.isArray(pv.properties) ? pv.properties[0] : pv.properties;
            const propName = prop?.name || 'Unknown';
            return `${propName}: ${pv.value}`;
          })
          .join(', ');

        variantInfoMap.set(variantId, {
          productName,
          characteristics: characteristics || ''
        });
      });
    }

    // Build top products with actual names and characteristics
    const top_products = Array.from(productMap.entries())
      .map(([id, data]) => {
        let displayName = 'Unknown Product';
        
        // Try to get variant info (check both the key and stored variantId)
        const variantInfo = variantInfoMap.get(id) || (data.variantId ? variantInfoMap.get(data.variantId) : null);
        
        if (variantInfo) {
          if (variantInfo.characteristics) {
            displayName = `${variantInfo.productName} - ${variantInfo.characteristics}`;
          } else {
            displayName = variantInfo.productName;
          }
        } else {
          // Try to get product name (check both the key and stored productId)
          const productName = productInfoMap.get(id) || (data.productId ? productInfoMap.get(data.productId) : null);
          
          if (productName) {
            displayName = productName;
          } else if (id === 'unknown') {
            displayName = 'Unknown Product';
          } else {
            // Last resort fallback
            displayName = `Product ${id.substring(0, 8)}`;
          }
        }

        return {
          name: displayName,
          quantity: data.quantity,
          revenue: data.revenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        totalOrders: total_orders,
        totalRevenue: total_sales,
        totalCustomers: total_customers,
        averageOrderValue: average_order_value,
        salesByDay: sales_by_day,
        topProducts: top_products,
        salesByStatus: sales_by_status
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}


