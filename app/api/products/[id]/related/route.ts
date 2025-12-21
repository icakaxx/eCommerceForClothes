import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get related products for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    // Get related products with full product details
    const { data: relatedProducts, error } = await supabase
      .from('related_products')
      .select(`
        *,
        related_product:relatedproductid_ref (
          *,
          product_types(*)
        )
      `)
      .eq('productid', id)
      .order('displayorder', { ascending: true });

    if (error) {
      console.error('Error fetching related products:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // For each related product, get variants and images
    const productsWithDetails = await Promise.all(
      (relatedProducts || []).map(async (rp: any) => {
        const product = rp.related_product;
        if (!product) return null;

        // Get variants
        const { data: variants } = await supabase
          .from('product_variants')
          .select('*')
          .eq('productid', product.productid);

        // Get images
        const { data: images } = await supabase
          .from('product_images')
          .select('*')
          .eq('productid', product.productid)
          .order('sortorder', { ascending: true });

        const firstVariant = variants?.[0];
        
        // Try to extract brand and model from name
        const nameParts = product.name?.split(' ') || [];
        const brand = nameParts[0] || 'Unknown';
        const model = nameParts.slice(1).join(' ') || product.name || 'Unknown';
        
        // Map ProductType code to legacy category
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
        const category = categoryMap[product.product_types?.code?.toLowerCase() || ''] || 'clothes';

        return {
          id: product.productid,
          productid: product.productid,
          brand: brand,
          model: model,
          name: product.name,
          category: category,
          type: product.product_types?.name || '',
          price: firstVariant?.price || 0,
          quantity: firstVariant?.quantity || 0,
          visible: firstVariant?.isvisible ?? true,
          images: images?.map((img: any) => img.imageurl) || ['/image.png'],
          description: product.description || '',
          subtitle: product.subtitle || '',
          variants: variants || []
        };
      })
    );

    // Filter out null entries
    const validProducts = productsWithDetails.filter(p => p !== null);

    return NextResponse.json({
      success: true,
      products: validProducts
    });

  } catch (error) {
    console.error('Failed to get related products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update related products for a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const body = await request.json();

    const { relatedProductIds = [] } = body;

    // Delete existing related products
    const { error: deleteError } = await supabase
      .from('related_products')
      .delete()
      .eq('productid', id);

    if (deleteError) {
      console.error('Error deleting existing related products:', deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    // Insert new related products
    if (relatedProductIds.length > 0) {
      const relatedProductsData = relatedProductIds.map((rpId: string, index: number) => ({
        productid: id,
        relatedproductid_ref: rpId,
        displayorder: index
      }));

      const { error: insertError } = await supabase
        .from('related_products')
        .insert(relatedProductsData);

      if (insertError) {
        console.error('Error inserting related products:', insertError);
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Related products updated successfully'
    });

  } catch (error) {
    console.error('Failed to update related products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


