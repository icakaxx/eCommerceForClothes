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

    // Top products (simplified - would need product names from product_variants)
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    orderItems?.forEach(item => {
      const key = item.productvariantid || item.productid || 'unknown';
      if (productMap.has(key)) {
        const product = productMap.get(key)!;
        product.quantity += item.quantity;
        product.revenue += item.quantity * parseFloat(item.price);
      } else {
        productMap.set(key, {
          quantity: item.quantity,
          revenue: item.quantity * parseFloat(item.price)
        });
      }
    });

    const top_products = Array.from(productMap.entries())
      .map(([id, data]) => ({
        name: `Product ${id.substring(0, 8)}`,
        ...data
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      analytics: {
        total_sales,
        total_orders,
        total_customers,
        average_order_value,
        sales_by_day,
        top_products,
        sales_by_status
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


