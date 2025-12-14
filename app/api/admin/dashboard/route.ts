export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

type DateFilter = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear';

function getDateRange(filter: DateFilter): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (filter) {
    case 'thisWeek': {
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'lastWeek': {
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek - 6; // Last Monday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(diff + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'thisMonth': {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'lastMonth': {
      start.setMonth(now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'thisYear': {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'lastYear': {
      start.setFullYear(now.getFullYear() - 1, 0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(now.getFullYear() - 1, 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    }
  }

  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get('filter') || 'thisMonth') as DateFilter;

    const { start, end } = getDateRange(filter);

    // Get total sales (sum of total from orders)
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from('orders')
      .select('total')
      .gte('createdat', start.toISOString())
      .lte('createdat', end.toISOString());

    if (salesError) {
      console.error('Error fetching sales:', salesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch sales data'
      }, { status: 500 });
    }

    const totalSales = salesData?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;

    // Get total orders count
    const { count: totalOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('createdat', start.toISOString())
      .lte('createdat', end.toISOString());

    if (ordersError) {
      console.error('Error fetching orders count:', ordersError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch orders count'
      }, { status: 500 });
    }

    // Get total products (not soft deleted)
    const { count: totalProducts, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .or('isdeleted.is.null,isdeleted.eq.false');

    if (productsError) {
      console.error('Error fetching products count:', productsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch products count'
      }, { status: 500 });
    }

    // Get unique customers count from orders
    const { data: customersData, error: customersError } = await supabaseAdmin
      .from('orders')
      .select('customeremail')
      .gte('createdat', start.toISOString())
      .lte('createdat', end.toISOString());

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch customers data'
      }, { status: 500 });
    }

    const uniqueCustomers = new Set(customersData?.map(order => order.customeremail) || []);
    const totalCustomers = uniqueCustomers.size;

    // Calculate growth (compare with previous period)
    let previousTotalSales = 0;
    let previousTotalOrders = 0;
    let previousTotalCustomers = 0;

    if (filter === 'thisWeek') {
      const { start: prevStart, end: prevEnd } = getDateRange('lastWeek');
      const { data: prevSalesData } = await supabaseAdmin
        .from('orders')
        .select('total')
        .gte('createdat', prevStart.toISOString())
        .lte('createdat', prevEnd.toISOString());
      previousTotalSales = prevSalesData?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;

      const { count: prevOrders } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('createdat', prevStart.toISOString())
        .lte('createdat', prevEnd.toISOString());
      previousTotalOrders = prevOrders || 0;

      const { data: prevCustomersData } = await supabaseAdmin
        .from('orders')
        .select('customeremail')
        .gte('createdat', prevStart.toISOString())
        .lte('createdat', prevEnd.toISOString());
      previousTotalCustomers = new Set(prevCustomersData?.map(order => order.customeremail) || []).size;
    } else if (filter === 'thisMonth') {
      const { start: prevStart, end: prevEnd } = getDateRange('lastMonth');
      const { data: prevSalesData } = await supabaseAdmin
        .from('orders')
        .select('total')
        .gte('createdat', prevStart.toISOString())
        .lte('createdat', prevEnd.toISOString());
      previousTotalSales = prevSalesData?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;

      const { count: prevOrders } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('createdat', prevStart.toISOString())
        .lte('createdat', prevEnd.toISOString());
      previousTotalOrders = prevOrders || 0;

      const { data: prevCustomersData } = await supabaseAdmin
        .from('orders')
        .select('customeremail')
        .gte('createdat', prevStart.toISOString())
        .lte('createdat', prevEnd.toISOString());
      previousTotalCustomers = new Set(prevCustomersData?.map(order => order.customeremail) || []).size;
    } else if (filter === 'thisYear') {
      const { start: prevStart, end: prevEnd } = getDateRange('lastYear');
      const { data: prevSalesData } = await supabaseAdmin
        .from('orders')
        .select('total')
        .gte('createdat', prevStart.toISOString())
        .lte('createdat', prevEnd.toISOString());
      previousTotalSales = prevSalesData?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;

      const { count: prevOrders } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('createdat', prevStart.toISOString())
        .lte('createdat', prevEnd.toISOString());
      previousTotalOrders = prevOrders || 0;

      const { data: prevCustomersData } = await supabaseAdmin
        .from('orders')
        .select('customeremail')
        .gte('createdat', prevStart.toISOString())
        .lte('createdat', prevEnd.toISOString());
      previousTotalCustomers = new Set(prevCustomersData?.map(order => order.customeremail) || []).size;
    }

    const salesGrowth = previousTotalSales > 0
      ? ((totalSales - previousTotalSales) / previousTotalSales) * 100
      : totalSales > 0 ? 100 : 0;

    const ordersGrowth = previousTotalOrders > 0
      ? ((totalOrders || 0) - previousTotalOrders) / previousTotalOrders * 100
      : (totalOrders || 0) > 0 ? 100 : 0;

    const customersGrowth = previousTotalCustomers > 0
      ? ((totalCustomers - previousTotalCustomers) / previousTotalCustomers) * 100
      : totalCustomers > 0 ? 100 : 0;

    // Products growth is not time-based, so we'll set it to 0 or calculate based on creation date
    const productsGrowth = 0;

    // Get weekly sales data for last week (orders per day)
    const { start: lastWeekStart, end: lastWeekEnd } = getDateRange('lastWeek');
    const { data: lastWeekOrders, error: weeklyError } = await supabaseAdmin
      .from('orders')
      .select('createdat')
      .gte('createdat', lastWeekStart.toISOString())
      .lte('createdat', lastWeekEnd.toISOString());

    // Get category performance data from orders
    // Fetch orders with their items and product information
    const { data: ordersWithItems, error: categoryError } = await supabaseAdmin
      .from('orders')
      .select(`
        orderid,
        total,
        order_items (
          orderitemid,
          productvariantid,
          productid
        )
      `)
      .gte('createdat', start.toISOString())
      .lte('createdat', end.toISOString());

    // Category mapping function
    const mapProductTypeToCategory = (code: string | null | undefined): 'clothes' | 'shoes' | 'accessories' => {
      if (!code) return 'clothes';
      const codeLower = code.toLowerCase();
      const categoryMap: Record<string, 'clothes' | 'shoes' | 'accessories'> = {
        'clothes': 'clothes',
        'shoes': 'shoes',
        'accessories': 'accessories',
        'shirts': 'clothes',
        'pants': 'clothes',
        'jackets': 'clothes',
        'sneakers': 'shoes',
        'boots': 'shoes',
        'bags': 'accessories',
        'watches': 'accessories'
      };
      return categoryMap[codeLower] || 'clothes';
    };

    // Process orders to get category data
    const categoryData: Record<string, { orders: number; sales: number }> = {
      'Clothes': { orders: 0, sales: 0 },
      'Shoes': { orders: 0, sales: 0 },
      'Accessories': { orders: 0, sales: 0 }
    };

    if (ordersWithItems && !categoryError) {
      // Get all unique product variant IDs and product IDs from order items
      const variantIds = new Set<string>();
      const productIds = new Set<string>();
      
      ordersWithItems.forEach((order: any) => {
        if (order.order_items) {
          order.order_items.forEach((item: any) => {
            if (item.productvariantid) {
              variantIds.add(item.productvariantid);
            }
            if (item.productid) {
              productIds.add(item.productid);
            }
          });
        }
      });

      // Fetch product variants with their products and product types
      const variantIdsArray = Array.from(variantIds);
      const productIdsArray = Array.from(productIds);
      
      const productTypeMap: Record<string, string> = {};

      if (variantIdsArray.length > 0) {
        const { data: variants } = await supabaseAdmin
          .from('product_variants')
          .select(`
            productvariantid,
            productid,
            products (
              productid,
              producttypeid,
              product_types (
                code
              )
            )
          `)
          .in('productvariantid', variantIdsArray);

        if (variants) {
          variants.forEach((variant: any) => {
            if (variant.products && variant.products.product_types) {
              productTypeMap[variant.productvariantid] = variant.products.product_types.code;
            }
          });
        }
      }

      if (productIdsArray.length > 0) {
        const { data: products } = await supabaseAdmin
          .from('products')
          .select(`
            productid,
            producttypeid,
            product_types (
              code
            )
          `)
          .in('productid', productIdsArray);

        if (products) {
          products.forEach((product: any) => {
            if (product.product_types) {
              productTypeMap[product.productid] = product.product_types.code;
            }
          });
        }
      }

      // Process orders and categorize them
      ordersWithItems.forEach((order: any) => {
        const orderCategories = new Set<string>();
        
        if (order.order_items && order.order_items.length > 0) {
          order.order_items.forEach((item: any) => {
            let category: string;
            if (item.productvariantid && productTypeMap[item.productvariantid]) {
              category = mapProductTypeToCategory(productTypeMap[item.productvariantid]);
            } else if (item.productid && productTypeMap[item.productid]) {
              category = mapProductTypeToCategory(productTypeMap[item.productid]);
            } else {
              category = 'clothes'; // Default
            }
            orderCategories.add(category);
          });
        } else {
          // If no items, default to clothes
          orderCategories.add('clothes');
        }

        // Count order and sales for each category in this order
        orderCategories.forEach(category => {
          const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
          if (categoryData[categoryName]) {
            categoryData[categoryName].orders += 1;
            // Distribute order total evenly across categories, or use full amount if single category
            const orderTotal = Number(order.total || 0);
            const salesPerCategory = orderCategories.size > 1 
              ? orderTotal / orderCategories.size 
              : orderTotal;
            categoryData[categoryName].sales += salesPerCategory;
          }
        });
      });
    }

    // Calculate percentages based on total sales
    const totalCategorySales = Object.values(categoryData).reduce((sum, cat) => sum + cat.sales, 0);
    const categoryPerformance = Object.entries(categoryData).map(([category, data]) => {
      const percentage = totalCategorySales > 0 ? (data.sales / totalCategorySales) * 100 : 0;
      const colorMap: Record<string, string> = {
        'Clothes': 'bg-blue-500',
        'Shoes': 'bg-green-500',
        'Accessories': 'bg-yellow-500'
      };
      return {
        category,
        percentage: Number(percentage.toFixed(1)),
        orders: data.orders,
        sales: data.sales,
        color: colorMap[category] || 'bg-gray-500'
      };
    });

    // Get recent orders (latest 4)
    const { data: recentOrdersData, error: recentOrdersError } = await supabaseAdmin
      .from('orders')
      .select('orderid, customerfirstname, customerlastname, total, status, createdat')
      .order('createdat', { ascending: false })
      .limit(4);

    const recentOrders = recentOrdersData?.map((order: any) => ({
      id: `#${order.orderid.substring(0, 8).toUpperCase()}`,
      customer: `${order.customerfirstname} ${order.customerlastname}`,
      amount: Number(order.total || 0),
      status: order.status || 'pending',
      date: new Date(order.createdat).toISOString().split('T')[0]
    })) || [];

    // Get top products based on order items (tracked by variant for specificity)
    // Fetch all order items with product information
    const { data: allOrderItems, error: orderItemsError } = await supabaseAdmin
      .from('order_items')
      .select(`
        orderitemid,
        quantity,
        price,
        productvariantid,
        productid,
        orderid,
        orders!inner(createdat)
      `)
      .gte('orders.createdat', start.toISOString())
      .lte('orders.createdat', end.toISOString());

    // Map to track variant sales (keyed by variant ID for specificity)
    const variantSalesMap: Record<string, { name: string; sales: number; revenue: number }> = {};

    if (allOrderItems && !orderItemsError) {
      // Get all unique product variant IDs (prioritize variants over products)
      const variantIds = new Set<string>();
      
      allOrderItems.forEach((item: any) => {
        if (item.productvariantid) {
          variantIds.add(item.productvariantid);
        }
      });

      // Fetch variant details with product name and property values
      if (variantIds.size > 0) {
        const { data: variants } = await supabaseAdmin
          .from('product_variants')
          .select(`
            productvariantid,
            productid,
            products (
              productid,
              name
            ),
            ProductVariantPropertyvalues:product_variant_property_values(
              value,
              Property:properties(
                name
              )
            )
          `)
          .in('productvariantid', Array.from(variantIds));

        if (variants) {
          // Build variant name map with property values
          variants.forEach((variant: any) => {
            const productName = variant.products?.name || 'Unknown Product';
            
            // Extract property values (color, size, etc.)
            const propertyValues: string[] = [];
            if (variant.ProductVariantPropertyvalues) {
              variant.ProductVariantPropertyvalues.forEach((pvv: any) => {
                if (pvv.Property?.name && pvv.value) {
                  propertyValues.push(pvv.value);
                }
              });
            }

            // Build descriptive name: "Product Name - Red, Size 42"
            let variantName = productName;
            if (propertyValues.length > 0) {
              variantName = `${productName} - ${propertyValues.join(', ')}`;
            }

            variantSalesMap[variant.productvariantid] = {
              name: variantName,
              sales: 0,
              revenue: 0
            };
          });
        }
      }

      // Process order items to calculate sales (only for variants)
      allOrderItems.forEach((item: any) => {
        if (item.productvariantid && variantSalesMap[item.productvariantid]) {
          const quantity = item.quantity || 0;
          const price = Number(item.price || 0);
          const revenue = quantity * price;

          variantSalesMap[item.productvariantid].sales += quantity;
          variantSalesMap[item.productvariantid].revenue += revenue;
        }
      });
    }

    // Convert to array and sort by revenue, take top 5
    const topProducts = Object.values(variantSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((product) => {
        // Calculate growth (compare with previous period if available)
        // For now, set growth to 0 or calculate based on previous period
        const growth = 0; // Could be enhanced to compare with previous period
        return {
          name: product.name,
          sales: product.sales,
          revenue: product.revenue,
          growth: growth
        };
      });

    // Process orders to count per day
    const weeklySales = [
      { day: 'Mon', sales: 0 },
      { day: 'Tue', sales: 0 },
      { day: 'Wed', sales: 0 },
      { day: 'Thu', sales: 0 },
      { day: 'Fri', sales: 0 },
      { day: 'Sat', sales: 0 },
      { day: 'Sun', sales: 0 }
    ];

    if (lastWeekOrders && !weeklyError) {
      lastWeekOrders.forEach(order => {
        const orderDate = new Date(order.createdat);
        const dayOfWeek = orderDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Convert to Monday-based week (0 = Monday, 6 = Sunday)
        const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        if (mondayBasedDay >= 0 && mondayBasedDay < 7) {
          weeklySales[mondayBasedDay].sales += 1;
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalSales,
        totalOrders: totalOrders || 0,
        totalProducts: totalProducts || 0,
        totalCustomers,
        salesGrowth: Number(salesGrowth.toFixed(1)),
        ordersGrowth: Number(ordersGrowth.toFixed(1)),
        productsGrowth,
        customersGrowth: Number(customersGrowth.toFixed(1)),
        weeklySales,
        categoryPerformance,
        recentOrders,
        topProducts
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

