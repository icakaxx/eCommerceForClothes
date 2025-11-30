import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    // Get product with JOINs for product_media and categories
    const { data: product, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get category from JOIN
    const categorySlug = product.product_categories?.[0]?.categories?.slug || 
                         product.metadata?.category || 
                         'clothes';

    // Transform to match Product interface - get images from JOIN
    const images = (product.product_media || [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((media: any) => media.url);

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        category: categorySlug as 'clothes' | 'shoes' | 'accessories',
        brand: product.metadata?.brand || product.title?.split(' ')[0] || product.title || '',
        model: product.subtitle || product.title?.split(' ').slice(1).join(' ') || '',
        type: product.metadata?.type,
        color: product.metadata?.color || '',
        size: product.metadata?.size,
        quantity: product.inventory_qty || 0,
        price: parseFloat(product.base_price) || 0,
        visible: product.status === 'active',
        images: images.length > 0 ? images : ['/image.png']
      }
    });

  } catch (error) {
    console.error('Failed to get product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
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

    // Update product
    const { data: product, error: productError } = await supabase
      .from('products')
      .update({
        title: `${brand} ${model}`,
        subtitle: model,
        description: `${brand} ${model}${type ? ` - ${type}` : ''}`,
        status: visible ? 'active' : 'hidden',
        base_price: price,
        inventory_qty: quantity || 0,
        metadata: {
          type,
          color,
          size,
          brand
        },
        tags: [category, brand, color].filter(Boolean)
      })
      .eq('id', id)
      .select()
      .single();

    if (productError) {
      console.error('Error updating product:', productError);
      return NextResponse.json(
        { error: productError.message },
        { status: 500 }
      );
    }

    // Update product media
    if (images && images.length > 0) {
      // Delete existing media
      await supabase
        .from('product_media')
        .delete()
        .eq('product_id', id);

      // Insert new media
      const mediaInserts = images.map((url: string, index: number) => ({
        product_id: id,
        media_type: 'image',
        url: url,
        alt: `${brand} ${model}`,
        position: index
      }));

      await supabase
        .from('product_media')
        .insert(mediaInserts);
    }

    // Update category link
    if (category) {
      // Get or create category
      let { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();

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
          .eq('product_id', id);

        // Add new category link
        await supabase
          .from('product_categories')
          .insert({
            product_id: id,
            category_id: categoryData.id
          });
      }
    }

    console.log('✅ Product updated successfully:', id);

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
    console.error('Failed to update product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    // Delete product (cascade will delete related records)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Product deleted successfully:', id);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

