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
      customerid: string;
      email: string;
      name: string;
      createdat: string;
      lastorder: string;
      totalorders: number;
      totalspent: number;
    }>();

    orders.forEach(order => {
      const email = order.customeremail;
      if (customerMap.has(email)) {
        const customer = customerMap.get(email)!;
        customer.totalorders += 1;
        customer.totalspent += parseFloat(order.total);
        if (new Date(order.createdat) > new Date(customer.lastorder)) {
          customer.lastorder = order.createdat;
        }
        // Update createdat to the earliest order date
        if (new Date(order.createdat) < new Date(customer.createdat)) {
          customer.createdat = order.createdat;
        }
      } else {
        customerMap.set(email, {
          customerid: email, // Use email as ID since we don't have a separate customer ID
          email: order.customeremail,
          name: `${order.customerfirstname} ${order.customerlastname}`.trim(),
          createdat: order.createdat, // First order date
          lastorder: order.createdat,
          totalorders: 1,
          totalspent: parseFloat(order.total)
        });
      }
    });

    const customers = Array.from(customerMap.values()).sort((a, b) =>
      new Date(b.lastorder).getTime() - new Date(a.lastorder).getTime()
    );

    console.log('🔍 DEBUG: Customers API returning:', customers.length, 'customers');
    console.log('🔍 DEBUG: Sample customer:', customers[0]);

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


