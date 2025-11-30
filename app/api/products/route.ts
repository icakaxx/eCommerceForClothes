import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Fetch all products
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    // Build query with JOINs for product_media and categories
    let query = supabase
      .from('products')
      .select(`
        *,
        product_media (
          id,
          media_type,
          url,
          alt,
          position
        ),
        product_categories (
          categories (
            slug,
            title
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Transform Supabase data to match Product interface
    const transformedProducts = products?.map((product: any) => {
      // Get images from product_media JOIN, sorted by position
      const images = (product.product_media || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((media: any) => media.url);

      // Get category from product_categories JOIN or metadata
      const productCategory = product.product_categories?.[0]?.categories?.slug || 
                             product.metadata?.category || 
                             'clothes';

      return {
        id: product.id,
        category: productCategory as 'clothes' | 'shoes' | 'accessories',
        brand: product.metadata?.brand || product.title?.split(' ')[0] || product.title || '',
        model: product.subtitle || product.title?.split(' ').slice(1).join(' ') || '',
        type: product.metadata?.type,
        color: product.metadata?.color || '',
        size: product.metadata?.size,
        quantity: product.inventory_qty || 0,
        price: parseFloat(product.base_price) || 0,
        visible: product.status === 'active',
        images: images.length > 0 ? images : ['/image.png'] // fallback image
      };
    }) || [];

    console.log(`✅ Fetched ${transformedProducts.length} products from database`);

    return NextResponse.json({
      success: true,
      products: transformedProducts
    });

  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    const {
      category,
      brand,
      model,
      type,
      color,
      size,
      quantity,
      price,
      visible,
      images
    } = body;

    // Validate required fields
    if (!category || !brand || !model || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: category, brand, model, price' },
        { status: 400 }
      );
    }

    // Generate slug from brand and model
    const slug = `${brand.toLowerCase()}-${model.toLowerCase()}`.replace(/[^a-z0-9-]/g, '-');

    // Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        slug: `${slug}-${Date.now()}`, // Make unique
        title: `${brand} ${model}`,
        subtitle: model,
        description: `${brand} ${model}${type ? ` - ${type}` : ''}`,
        status: visible ? 'active' : 'hidden',
        base_price: price,
        currency: 'EUR',
        inventory_qty: quantity || 0,
        inventory_policy: 'deny',
        tags: [category, brand, color].filter(Boolean),
        metadata: {
          type,
          color,
          size,
          brand
        },
        seo: {}
      })
      .select()
      .single();

    if (productError) {
      console.error('Error creating product:', productError);
      return NextResponse.json(
        { error: productError.message },
        { status: 500 }
      );
    }

    // Insert product media (images)
    if (images && images.length > 0) {
      const mediaInserts = images.map((url: string, index: number) => ({
        product_id: product.id,
        media_type: 'image',
        url: url,
        alt: `${brand} ${model}`,
        position: index
      }));

      const { error: mediaError } = await supabase
        .from('product_media')
        .insert(mediaInserts);

      if (mediaError) {
        console.error('Error inserting product media:', mediaError);
        // Don't fail the whole request if media fails
      }
    }

    // Get or create category and link product to category
    if (category) {
      // First, try to find existing category
      let { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();

      // If category doesn't exist, create it
      if (!categoryData) {
        const { data: newCategory } = await supabase
          .from('categories')
          .insert({
            slug: category,
            title: category.charAt(0).toUpperCase() + category.slice(1),
            is_active: true
          })
          .select()
          .single();
        
        categoryData = newCategory;
      }

      if (categoryData) {
        // Remove existing category links
        await supabase
          .from('product_categories')
          .delete()
          .eq('product_id', product.id);

        // Add new category link
        await supabase
          .from('product_categories')
          .insert({
            product_id: product.id,
            category_id: categoryData.id
          });
      }
    }

    console.log('✅ Product created successfully:', product.id);

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        category,
        brand,
        model,
        type,
        color,
        size,
        quantity: product.inventory_qty,
        price: parseFloat(product.base_price),
        visible: product.status === 'active',
        images: images || []
      }
    });

  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

