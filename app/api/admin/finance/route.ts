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
    let previousStartDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        previousStartDate = new Date(startDate);
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        previousStartDate = new Date(startDate);
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        previousStartDate = new Date(0);
        break;
    }

    // Fetch current period orders
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
        error: 'Failed to fetch finance data'
      }, { status: 500 });
    }

    // Fetch previous period orders for comparison
    let previousQuery = supabaseAdmin
      .from('orders')
      .select('*');

    if (period !== 'all') {
      previousQuery = previousQuery
        .gte('createdat', previousStartDate.toISOString())
        .lt('createdat', startDate.toISOString());
    } else {
      previousQuery = previousQuery.lt('createdat', '1970-01-01'); // No previous data for "all"
    }

    const { data: previousOrders } = await previousQuery;

    // Calculate summary
    const currentOrders = orders || [];
    const prevOrders = previousOrders || [];

    const total_revenue = currentOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const total_delivery_cost = currentOrders.reduce((sum, order) => sum + parseFloat(order.deliverycost), 0);
    const net_revenue = total_revenue - total_delivery_cost;
    const total_orders = currentOrders.length;
    const average_order_value = total_orders > 0 ? total_revenue / total_orders : 0;

    const prev_revenue = prevOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const prev_orders = prevOrders.length;
    const revenue_change = prev_revenue > 0 ? ((total_revenue - prev_revenue) / prev_revenue) * 100 : 0;
    const orders_change = prev_orders > 0 ? ((total_orders - prev_orders) / prev_orders) * 100 : 0;

    // Create transactions list
    const transactions = currentOrders.map(order => ({
      orderid: order.orderid,
      date: order.createdat,
      customer: `${order.customerfirstname} ${order.customerlastname}`,
      amount: parseFloat(order.total),
      status: order.status,
      type: 'order' as const
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: total_revenue,
        totalOrders: total_orders,
        averageOrderValue: average_order_value,
        monthlyRevenue: total_revenue, // For now, showing current period as monthly
        pendingPayments: 0, // TODO: Calculate actual pending payments
        totalDeliveryCost: total_delivery_cost,
        netRevenue: net_revenue,
        revenueChange: revenue_change,
        ordersChange: orders_change,
        transactions
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


