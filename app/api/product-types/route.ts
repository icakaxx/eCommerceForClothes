import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Fetch all product types with counts
// First tries to use PostgreSQL function with LEFT OUTER JOINs and GROUP BY (if exists)
// Falls back to optimized batch queries if function doesn't exist
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const rfproducttypeid = searchParams.get('rfproducttypeid');

    
    // Try to use PostgreSQL function with LEFT OUTER JOINs and GROUP BY
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_product_types_with_counts', {
        p_rfproducttypeid: rfproducttypeid ? parseInt(rfproducttypeid) : null
      });

      if (!rpcError && rpcData) {
        // Transform the data to match expected format
        const productTypesWithCounts = rpcData.map((item: any) => ({
          producttypeid: item.producttypeid,
          name: item.name,
          createdat: item.createdat,
          updatedat: item.updatedat,
          propertiesCount: item.propertiescount || 0,
          productsCount: item.productscount || 0
        }));

        return NextResponse.json({
          success: true,
          productTypes: productTypesWithCounts
        });
      }
    } catch (rpcErr) {
      // Function doesn't exist, fall through to batch query approach
      console.log('RPC function not available, using batch queries');
    }

    // Fallback: Use optimized batch queries (much better than N+1 queries)
    let query = supabase
      .from('product_types')
      .select('*');

    // Filter by rfproducttypeid if provided
    if (rfproducttypeid) {
    }

    const { data: productTypes, error } = await query
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching product types:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!productTypes || productTypes.length === 0) {
      return NextResponse.json({
        success: true,
        productTypes: []
      });
    }

    // Get all product type IDs
    const productTypeIds = productTypes.map((pt: any) => pt.producttypeid);

    // Batch fetch all property counts in one query
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('product_type_properties')
      .select('producttypeid')
      .in('producttypeid', productTypeIds);

    // Batch fetch all product counts in one query (excluding deleted)
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('producttypeid')
      .in('producttypeid', productTypeIds)
      .eq('isdeleted', false);

    if (propertiesError) {
      console.error('Error fetching property counts:', propertiesError);
    }

    if (productsError) {
      console.error('Error fetching product counts:', productsError);
    }

    // Count occurrences for each product type
    const propertiesCountMap: Record<string, number> = {};
    const productsCountMap: Record<string, number> = {};

    // Initialize all counts to 0
    productTypeIds.forEach((id: string) => {
      propertiesCountMap[id] = 0;
      productsCountMap[id] = 0;
    });

    // Count properties
    (propertiesData || []).forEach((item: any) => {
      const id = item.producttypeid;
      propertiesCountMap[id] = (propertiesCountMap[id] || 0) + 1;
    });

    // Count products
    (productsData || []).forEach((item: any) => {
      const id = item.producttypeid;
      productsCountMap[id] = (productsCountMap[id] || 0) + 1;
    });

    // Combine results
    const productTypesWithCounts = productTypes.map((pt: any) => ({
      ...pt,
      propertiesCount: propertiesCountMap[pt.producttypeid] || 0,
      productsCount: productsCountMap[pt.producttypeid] || 0
    }));

    return NextResponse.json({
      success: true,
      productTypes: productTypesWithCounts
    });

  } catch (error) {
    console.error('Failed to fetch product types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new product type
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    const { name, rfproducttypeid } = body;


    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const { data: productType, error } = await supabase
      .from('product_types')
      .insert({
        name,
        updatedat: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product type:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      productType
    });

  } catch (error) {
    console.error('Failed to create product type:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}




