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
      .eq('ProductID', id)
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
        ProductVariantPropertyValues:product_variant_property_values(
          *,
          Property:properties(*)
        )
      `)
      .eq('ProductID', product.ProductID);

    // Get all product images
    const { data: allImages } = await supabase
      .from('product_images')
      .select('*')
      .eq('ProductID', product.ProductID)
      .order('SortOrder', { ascending: true });

    // Attach images to their variants
    const variantsWithImages = variants?.map(variant => {
      const variantImage = allImages?.find(img => img.ProductVariantID === variant.ProductVariantID);
      return {
        ...variant,
        ImageURL: variantImage?.ImageURL,
        IsPrimaryImage: variantImage?.IsPrimary || false
      };
    });

    // Get general product images (not variant-specific)
    const images = allImages?.filter(img => !img.ProductVariantID) || [];

    // Transform to new format with backwards compatibility
    const firstVariant = variants?.[0];
    
    // Extract property values from variant for easy access
    const variantProperties: Record<string, string> = {};
    firstVariant?.ProductVariantPropertyValues?.forEach((pv: ProductVariantPropertyValue) => {
      if (pv.Property?.Name) {
        variantProperties[pv.Property.Name] = pv.Value;
      }
    });
    
    // Try to extract brand and model from Name (format: "Brand Model")
    const nameParts = product.Name?.split(' ') || [];
    const brand = nameParts[0] || 'Unknown';
    const model = nameParts.slice(1).join(' ') || product.Name || 'Unknown';
    
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
      ProductID: product.ProductID,
      Name: product.Name,
      SKU: product.SKU,
      Description: product.Description,
      ProductTypeID: product.ProductTypeID,
      ProductType: product.ProductType,
      Variants: variantsWithImages || [],
      Images: images || [],
      
      // Legacy fields for backwards compatibility
      id: product.ProductID,
      brand: brand,
      model: model,
      category: category,
      type: product.ProductType?.Name || '',
      color: variantProperties.color || variantProperties.colour || '',
      size: variantProperties.size || '',
      quantity: firstVariant?.Quantity || 0,
      price: firstVariant?.Price || 0,
      visible: firstVariant?.IsVisible ?? true,
      images: images?.map(img => img.ImageURL) || ['/image.png'],
      description: product.Description || '',
      productTypeID: product.ProductTypeID,
      propertyValues: variantProperties
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
      Name,
      SKU,
      Description,
      ProductTypeID,
      Variants = []
    } = body;

    console.log('📦 Variants to process:', Variants.length);
    Variants.forEach((v: any, i: number) => {
      console.log(`  Variant ${i}:`, { 
        SKU: v.SKU, 
        Price: v.Price, 
        Quantity: v.Quantity,
        PropertyValues: v.PropertyValues 
      });
    });

    // Update product
    const { data: product, error: productError } = await supabase
      .from('products')
      .update({
        Name,
        SKU: SKU || null,
        Description: Description || null,
        ProductTypeID,
        UpdatedAt: new Date().toISOString()
      })
      .eq('ProductID', id)
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
      // Delete existing variant images first (cascade doesn't work on ProductVariantID FK)
      await supabase
        .from('product_images')
        .delete()
        .eq('ProductID', id)
        .not('ProductVariantID', 'is', null); // Only delete variant-specific images
      
      // Delete existing variants (this will cascade delete property values)
      const { error: deleteError } = await supabase
        .from('product_variants')
        .delete()
        .eq('ProductID', id);
      
      if (deleteError) {
        console.error('❌ Error deleting existing variants:', deleteError);
      } else {
        console.log('✅ Deleted existing variants and their images');
      }

      // Create new variants
      for (const variantData of Variants) {
        const {
          ProductVariantID, // May be present for updates
          SKU: variantSKU,
          Price,
          CompareAtPrice,
          Cost,
          Quantity,
          Weight,
          WeightUnit,
          Barcode,
          TrackQuantity,
          ContinueSellingWhenOutOfStock,
          IsVisible,
          PropertyValues = [],
          ImageURL,
          IsPrimaryImage
        } = variantData;

        console.log('🔨 Attempting to insert variant:', {
          ProductID: id,
          SKU: variantSKU,
          Price,
          Quantity,
          WeightUnit: WeightUnit || 'kg',
          TrackQuantity: TrackQuantity ?? true,
          IsVisible: IsVisible ?? true
        });

        // Create variant
        const { data: variant, error: variantError } = await supabase
          .from('product_variants')
          .insert({
            ProductID: id,
            SKU: variantSKU,
            Price,
            CompareAtPrice,
            Cost,
            Quantity,
            Weight,
            WeightUnit: WeightUnit || 'kg',
            Barcode,
            TrackQuantity: TrackQuantity ?? true,
            ContinueSellingWhenOutOfStock: ContinueSellingWhenOutOfStock ?? false,
            IsVisible: IsVisible ?? true
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
        if (PropertyValues.length > 0) {
          const propertyValuesData = PropertyValues.map((pv: any) => ({
            ProductVariantID: variant.ProductVariantID,
            PropertyID: pv.PropertyID,
            Value: pv.Value
          }));

          const { error: pvError } = await supabase
            .from('product_variant_property_values')
            .insert(propertyValuesData);

          if (pvError) {
            console.error('Error creating property values:', pvError);
          }
        }

        // Create image for this variant if provided
        if (ImageURL) {
          console.log('🖼️ Saving variant image:', {
            ProductID: id,
            ProductVariantID: variant.ProductVariantID,
            ImageURL: ImageURL,
            IsPrimary: IsPrimaryImage || false
          });
          
          const { data: imageData, error: imageError } = await supabase
            .from('product_images')
            .insert({
              ProductID: id,
              ProductVariantID: variant.ProductVariantID,
              ImageURL: ImageURL,
              IsPrimary: IsPrimaryImage || false,
              SortOrder: 0
            })
            .select();

          if (imageError) {
            console.error('❌ Error creating variant image:', imageError);
          } else {
            console.log('✅ Variant image saved:', imageData);
          }
        } else {
          console.log('⚠️ No ImageURL for variant:', variant.ProductVariantID);
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
      .eq('ProductID', id);

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
