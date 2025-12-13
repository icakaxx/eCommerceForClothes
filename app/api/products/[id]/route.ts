import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { ProductVariantPropertyValue } from '@/lib/types/product-types';

// GET - Get single product with variants and images
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    // Get product with product type
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        ProductType:product_types(*)
      `)
      .eq('productid', id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get variants with their images
    const { data: variants } = await supabase
      .from('product_variants')
      .select(`
        *,
        ProductVariantPropertyvalues:product_variant_property_values(
          *,
          Property:properties(*)
        )
      `)
      .eq('productid', product.productid);

    // Get all product images
    const { data: allImages } = await supabase
      .from('product_images')
      .select('*')
      .eq('productid', product.productid)
      .order('sortorder', { ascending: true });

    // Attach images to their variants
    const variantsWithImages = variants?.map(variant => {
      const variantImage = allImages?.find(img => img.productvariantid === variant.productvariantid);
      return {
        ...variant,
        imageurl: variantImage?.imageurl,
        IsPrimaryImage: variantImage?.IsPrimary || false
      };
    });

    // Get general product images (not variant-specific)
    const images = allImages?.filter(img => !img.productvariantid) || [];

    // Transform to new format with backwards compatibility
    const firstVariant = variants?.[0];
    
    // Extract property values from variant for easy access
    const variantProperties: Record<string, string> = {};
    firstVariant?.ProductVariantPropertyValues?.forEach((pv: ProductVariantPropertyValue) => {
      if (pv.property?.name) {
        variantProperties[pv.property.name] = pv.value;
      }
    });
    
    // Try to extract brand and model from name (format: "Brand Model")
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
    const category = categoryMap[product.ProductType?.Code?.toLowerCase() || ''] || 'clothes';
    
    const legacyProduct = {
      // New schema fields
      productid: product.productid,
      name: product.name,
      sku: product.sku,
      description: product.description,
      producttypeid: product.producttypeid,
      ProductType: product.ProductType,
      Variants: variantsWithImages || [],
      Images: images || [],
      
      // Legacy fields for backwards compatibility
      id: product.productid,
      brand: brand,
      model: model,
      category: category,
      type: product.ProductType?.name || '',
      color: variantProperties.color || variantProperties.colour || '',
      size: variantProperties.size || '',
      quantity: firstVariant?.quantity || 0,
      price: firstVariant?.price || 0,
      visible: firstVariant?.isvisible ?? true,
      images: images?.map(img => img.imageurl) || ['/image.png'],
      productTypeID: product.producttypeid,
      propertyvalues: variantProperties
    };

    return NextResponse.json({
      success: true,
      product: legacyProduct
    });

  } catch (error) {
    console.error('Failed to get product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update product with variants
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const body = await request.json();

    console.log('📝 PUT /api/products/[id] - Received body:', JSON.stringify(body, null, 2));

    const {
      name,
      sku,
      description,
      producttypeid,
      Variants = []
    } = body;

    console.log('📦 Variants to process:', Variants.length);
    Variants.forEach((v: any, i: number) => {
      console.log(`  Variant ${i}:`, { 
        sku: v.sku, 
        price: v.price, 
        quantity: v.quantity,
        Propertyvalues: v.Propertyvalues 
      });
    });

    // Update product
    const { data: product, error: productError } = await supabase
      .from('products')
      .update({
        name,
        sku: sku || null,
        description: description || null,
        producttypeid,
        updatedat: new Date().toISOString()
      })
      .eq('productid', id)
      .select()
      .single();

    if (productError) {
      console.error('Error updating product:', productError);
      return NextResponse.json(
        { error: productError.message },
        { status: 500 }
      );
    }

    // Handle variants
    if (Variants.length > 0) {
      // Delete existing variant images first (cascade doesn't work on productvariantid FK)
      await supabase
        .from('product_images')
        .delete()
        .eq('productid', id)
        .not('productvariantid', 'is', null); // Only delete variant-specific images
      
      // Delete existing variants (this will cascade delete property values)
      const { error: deleteError } = await supabase
        .from('product_variants')
        .delete()
        .eq('productid', id);
      
      if (deleteError) {
        console.error('❌ Error deleting existing variants:', deleteError);
      } else {
        console.log('✅ Deleted existing variants and their images');
      }

      // Create new variants
      for (const variantData of Variants) {
        const {
          productvariantid, // May be present for updates
          sku: variantsku,
          price,
          CompareAtprice,
          cost,
          quantity,
          weight,
          weightUnit,
          barcode,
          Trackquantity,
          ContinueSellingWhenOutOfStock,
          isvisible,
          Propertyvalues = [],
          imageurl,
          IsPrimaryImage
        } = variantData;

        console.log('🔨 Attempting to insert variant:', {
          productid: id,
          sku: variantsku,
          price,
          quantity,
          weightUnit: weightUnit || 'kg',
          Trackquantity: Trackquantity ?? true,
          isvisible: isvisible ?? true
        });

        // Create variant
        const { data: variant, error: variantError } = await supabase
          .from('product_variants')
          .insert({
            productid: id,
            sku: variantsku,
            price,
            CompareAtprice,
            cost,
            quantity,
            weight,
            weightUnit: weightUnit || 'kg',
            barcode,
            Trackquantity: Trackquantity ?? true,
            ContinueSellingWhenOutOfStock: ContinueSellingWhenOutOfStock ?? false,
            isvisible: isvisible ?? true
          })
          .select()
          .single();

        if (variantError) {
          console.error('❌ Error creating variant:', variantError);
          console.error('❌ Error details:', JSON.stringify(variantError, null, 2));
          continue;
        }

        console.log('✅ Created variant:', variant);

        // Create property values for this variant
        if (Propertyvalues.length > 0) {
          const propertyvaluesData = Propertyvalues.map((pv: any) => ({
            productvariantid: variant.productvariantid,
            propertyid: pv.propertyid,
            value: pv.value
          }));

          const { error: pvError } = await supabase
            .from('product_variant_property_values')
            .insert(propertyvaluesData);

          if (pvError) {
            console.error('Error creating property values:', pvError);
          }
        }

        // Create image for this variant if provided
        if (imageurl) {
          console.log('🖼️ Saving variant image:', {
            productid: id,
            productvariantid: variant.productvariantid,
            imageurl: imageurl,
            IsPrimary: IsPrimaryImage || false
          });
          
          const { data: imageData, error: imageError } = await supabase
            .from('product_images')
            .insert({
              productid: id,
              productvariantid: variant.productvariantid,
              imageurl: imageurl,
              IsPrimary: IsPrimaryImage || false,
              sortorder: 0
            })
            .select();

          if (imageError) {
            console.error('❌ Error creating variant image:', imageError);
          } else {
            console.log('✅ Variant image saved:', imageData);
          }
        } else {
          console.log('⚠️ No imageurl for variant:', variant.productvariantid);
        }
      }
    }

    console.log('✅ Product updated successfully:', id);

    return NextResponse.json({
      success: true,
      product
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

    // Delete product (cascade will delete related property values)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('productid', id);

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
