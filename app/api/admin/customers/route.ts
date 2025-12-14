export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    // Fetch all unique customers from orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('createdat', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch customers'
      }, { status: 500 });
    }

    // Group orders by customer email to get customer statistics
    const customerMap = new Map<string, {
      customeremail: string;
      customerfirstname: string;
      customerlastname: string;
      customertelephone: string;
      customercountry: string;
      customercity: string;
      total_orders: number;
      total_spent: number;
      last_order_date: string;
    }>();

    orders.forEach(order => {
      const email = order.customeremail;
      if (customerMap.has(email)) {
        const customer = customerMap.get(email)!;
        customer.total_orders += 1;
        customer.total_spent += parseFloat(order.total);
        if (new Date(order.createdat) > new Date(customer.last_order_date)) {
          customer.last_order_date = order.createdat;
        }
      } else {
        customerMap.set(email, {
          customeremail: order.customeremail,
          customerfirstname: order.customerfirstname,
          customerlastname: order.customerlastname,
          customertelephone: order.customertelephone,
          customercountry: order.customercountry,
          customercity: order.customercity,
          total_orders: 1,
          total_spent: parseFloat(order.total),
          last_order_date: order.createdat
        });
      }
    });

    const customers = Array.from(customerMap.values()).sort((a, b) => 
      new Date(b.last_order_date).getTime() - new Date(a.last_order_date).getTime()
    );

    return NextResponse.json({
      success: true,
      customers
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

