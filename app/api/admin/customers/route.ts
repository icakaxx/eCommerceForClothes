export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    // Fetch all customers
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .order('createdat', { ascending: false });

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch customers'
      }, { status: 500 });
    }

    // Fetch all orders to calculate statistics
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('customerid, total, createdat');

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch order statistics'
      }, { status: 500 });
    }

    // Calculate statistics for each customer
    const customersWithStats = customers.map(customer => {
      const customerOrders = orders.filter(order => order.customerid === customer.customerid);
      
      const totalOrders = customerOrders.length;
      const totalSpent = customerOrders.reduce((sum, order) => sum + parseFloat(order.total as any), 0);
      
      // Find last order date
      const lastOrderDate = customerOrders.length > 0
        ? customerOrders.reduce((latest, order) => {
            const orderDate = new Date(order.createdat);
            return orderDate > new Date(latest) ? order.createdat : latest;
          }, customerOrders[0].createdat)
        : customer.createdat;

      return {
        customerid: customer.customerid,
        email: customer.email,
        name: `${customer.firstname} ${customer.lastname}`.trim(),
        firstname: customer.firstname,
        lastname: customer.lastname,
        telephone: customer.telephone,
        country: customer.country,
        city: customer.city,
        createdat: customer.createdat,
        lastorder: lastOrderDate,
        totalorders: totalOrders,
        totalspent: totalSpent
      };
    });

    // Sort by last order date (most recent first)
    const sortedCustomers = customersWithStats.sort((a, b) =>
      new Date(b.lastorder).getTime() - new Date(a.lastorder).getTime()
    );

    console.log('🔍 DEBUG: Customers API returning:', sortedCustomers.length, 'customers');
    console.log('🔍 DEBUG: Sample customer:', sortedCustomers[0]);

    return NextResponse.json({
      success: true,
      customers: sortedCustomers
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}


