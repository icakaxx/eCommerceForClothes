import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { ProductVariantPropertyValue } from '@/lib/types/product-types';

// Ensure SKUs are unique by checking database and generating alternatives if needed
async function ensureUniqueSKUs(variants: any[], supabase: any) {
  if (variants.length === 0) return variants;

  // Get all SKUs from variants
  const skus = variants.map(v => v.sku).filter(Boolean);
  if (skus.length === 0) return variants;

  // Batch check all SKUs at once
  const { data: existingVariants } = await supabase
    .from('product_variants')
    .select('sku')
    .in('sku', skus);

  const existingSKUs = new Set((existingVariants || []).map((v: any) => v.sku));

  // Process each variant to ensure unique SKU
  const processedVariants = [];
  for (const variant of variants) {
    let finalSKU = variant.sku;
    let counter = 1;

    // Only check if SKU is in the existing set
    while (existingSKUs.has(finalSKU)) {
      // Generate alternative SKU
      const baseSKU = variant.sku.split('-').slice(0, -1).join('-') || variant.sku;
      finalSKU = `${baseSKU}-${counter}`;
      counter++;

      // Safety check to prevent infinite loops
      if (counter > 100) {
        finalSKU = `${variant.sku}_${Date.now()}`;
        break;
      }
    }

    // Add to set to prevent duplicates within the same batch
    if (finalSKU !== variant.sku) {
      existingSKUs.add(finalSKU);
    }

    processedVariants.push({
      ...variant,
      sku: finalSKU
    });
  }

  return processedVariants;
}

// GET - Get single product with variants and images
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    // Get product with product type (exclude soft-deleted)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        ProductType:product_types(*)
      `)
      .eq('productid', id)
      .neq('isdeleted', true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get variants first
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('*')
      .eq('productid', product.productid);

    // Then get property values for all variants separately
    let variantsWithProps = variants || [];
    if (variants && variants.length > 0) {
      const variantIds = variants.map(v => v.productvariantid);
      
      // Try lowercase first (Supabase PostgREST typically uses lowercase)
      const { data: propertyValues, error: pvError } = await supabase
        .from('product_variant_property_values')
        .select(`
          *,
          Property:properties(*),
          properties(*)
        `)
        .in('productvariantid', variantIds);
      
      console.log('🔍 Property values query:', {
        variantIdsCount: variantIds.length,
        propertyValuesCount: propertyValues?.length || 0,
        error: pvError?.message,
        sampleVariantId: variantIds[0],
        samplePropertyValue: propertyValues?.[0]
      });
      
      let finalPropertyValues = propertyValues;
      
      // If that fails or returns empty, try PascalCase
      if (pvError || !propertyValues || propertyValues.length === 0) {
        console.log('⚠️ Lowercase query failed or returned empty, trying PascalCase...');
        const { data: propertyValuesUpper, error: pvErrorUpper } = await supabase
          .from('product_variant_property_values')
          .select(`
            *,
            Property:properties(*),
            properties(*)
          `)
          .in('ProductVariantID', variantIds);
        
        if (!pvErrorUpper && propertyValuesUpper && propertyValuesUpper.length > 0) {
          finalPropertyValues = propertyValuesUpper;
          console.log('✅ PascalCase query succeeded, found', propertyValuesUpper.length, 'property values');
        } else {
          console.log('❌ Both queries failed. Errors:', {
            lowercase: pvError?.message,
            pascalCase: pvErrorUpper?.message
          });
        }
      }

      if (pvError && (!finalPropertyValues || finalPropertyValues.length === 0)) {
        console.error('❌ Error fetching property values:', pvError);
      } else {
        console.log('📦 Fetched property values count:', finalPropertyValues?.length || 0);
        
        // Group property values by variant
        const propsByVariant: Record<string, any[]> = {};
        finalPropertyValues?.forEach((pv: any) => {
          // Handle both PascalCase and lowercase column names
          const variantId = pv.ProductVariantID || pv.productvariantid;
          if (variantId) {
            if (!propsByVariant[variantId]) {
              propsByVariant[variantId] = [];
            }
            propsByVariant[variantId].push(pv);
          }
        });

        console.log('📊 Property values grouped by variant:', Object.keys(propsByVariant).length, 'variants have properties');
        Object.entries(propsByVariant).forEach(([variantId, props]) => {
          console.log(`  Variant ${variantId}: ${props.length} properties`);
        });

        // Attach property values to variants
        variantsWithProps = variants.map(variant => {
          const variantId = variant.productvariantid || variant.ProductVariantID;
          const props = propsByVariant[variantId] || [];
          return {
            ...variant,
            ProductVariantPropertyvalues: props,
            // Also add lowercase version for compatibility
            product_variant_property_values: props
          };
        });

        // Debug log
        variantsWithProps.forEach((v: any) => {
          const props = v.ProductVariantPropertyvalues || [];
          console.log(`  Variant ${v.productvariantid}:`, {
            sku: v.sku,
            propertyValuesCount: props.length,
            properties: props.map((pv: any) => ({
              propertyName: pv.Property?.name || pv.Property?.Name || pv.properties?.name,
              value: pv.value || pv.Value,
              hasProperty: !!(pv.Property || pv.properties)
            }))
          });
        });
      }
    }

    if (variantsError) {
      console.error('❌ Error fetching variants:', variantsError);
    } else {
      console.log('📦 Fetched variants count:', variants?.length || 0);
    }

    // Get all product images
    const { data: allImages } = await supabase
      .from('product_images')
      .select('*')
      .eq('productid', product.productid)
      .order('sortorder', { ascending: true });

    // Attach images to their variants (using variantsWithProps which has property values)
    const variantsWithImages = variantsWithProps?.map(variant => {
      // Get all images for this variant
      const variantImagesList = allImages?.filter(img => img.productvariantid === variant.productvariantid) || [];
      const variantImageUrls = variantImagesList.map(img => img.imageurl).filter(Boolean) as string[];
      
      // For backwards compatibility, also include single imageurl
      const firstVariantImage = variantImagesList[0];
      
      const variantData = {
        ...variant,
        images: variantImageUrls.length > 0 ? variantImageUrls : undefined,
        imageurl: firstVariantImage?.imageurl,
        IsPrimaryImage: firstVariantImage?.isprimary || false
      };
      
      // Debug: Log the variant structure to ensure property values are preserved
      if (variant.ProductVariantPropertyvalues) {
        console.log(`✅ Variant ${variant.productvariantid} has ${variant.ProductVariantPropertyvalues.length} property values and ${variantImageUrls.length} images`);
      } else {
        console.log(`⚠️ Variant ${variant.productvariantid} has NO property values but has ${variantImageUrls.length} images`);
      }
      
      return variantData;
    });

    // Get general product images (not variant-specific)
    const images = allImages?.filter(img => !img.productvariantid) || [];

    // Transform to new format with backwards compatibility
    const firstVariant = variants?.[0];
    
    // Extract all unique property values from all variants for easy access
    const variantProperties: Record<string, string[]> = {};
    // Collect all property values across all variants
    (variantsWithImages || []).forEach(variant => {
      const variantProps = variant.ProductVariantPropertyvalues || variant.ProductVariantPropertyValues || [];
      variantProps.forEach((pv: any) => {
        const propName = pv.Property?.name || pv.property?.name;
        const propValue = pv.value || pv.Value;
        if (propName && propValue) {
          const key = propName.toLowerCase();
          if (!variantProperties[key]) {
            variantProperties[key] = [];
          }
          // Only add if not already present
          if (!variantProperties[key].includes(propValue)) {
            variantProperties[key].push(propValue);
          }
        }
      });
    });

    // For backwards compatibility, also create a flattened version
    const flattenedProperties: Record<string, string> = {};
    Object.entries(variantProperties).forEach(([key, values]) => {
      if (values.length > 0) {
        // For single values, use the first one; for multiple values, join them
        flattenedProperties[key] = values.length === 1 ? values[0] : values.join(', ');
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
    
    // Debug logging
    console.log('📦 Product variants count:', variantsWithImages?.length || 0);
    if (variantsWithImages && variantsWithImages.length > 0) {
      variantsWithImages.forEach((v: any, i: number) => {
        const props = v.ProductVariantPropertyvalues || [];
        console.log(`  Variant ${i}:`, {
          id: v.productvariantid,
          isvisible: v.isvisible,
          propertyValuesCount: props.length,
          propertyValues: props.map((pv: any) => ({
            property: pv.Property?.name || pv.propertyid,
            value: pv.value
          }))
        });
      });
    }

    const legacyProduct = {
      // New schema fields
      productid: product.productid,
      name: product.name,
      sku: product.sku,
      description: product.description,
      subtitle: product.subtitle || '', // Add subtitle field
      producttypeid: product.producttypeid,
      ProductType: product.ProductType,
      Variants: variantsWithImages || [],
      variants: variantsWithImages || [], // Add lowercase version for compatibility
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
      propertyvalues: flattenedProperties, // For backwards compatibility
      propertyValues: variantProperties // New format with all values
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
      subtitle,
      producttypeid,
      rfproducttypeid,
      isfeatured,
      Variants = []
    } = body;
    const productImages = Array.isArray(body.productImages) ? body.productImages.filter(Boolean) : [];


    // Ensure SKUs are unique before creating variants
    const uniqueVariants = await ensureUniqueSKUs(Variants, supabase);

    // Update product
    const { data: product, error: productError } = await supabase
      .from('products')
      .update({
        name,
        sku: sku || null,
        description: description || null,
        subtitle: subtitle || null,
        producttypeid,
        rfproducttypeid: rfproducttypeid || 1, // Default to 1 (For Him) if not provided
        isfeatured: isfeatured || false,
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

    const { error: deleteProductImagesError } = await supabase
      .from('product_images')
      .delete()
      .eq('productid', id)
      .is('productvariantid', null);

    if (deleteProductImagesError) {
      console.error('Error deleting product images:', deleteProductImagesError);
      return NextResponse.json(
        { error: deleteProductImagesError.message },
        { status: 500 }
      );
    }

    if (productImages.length > 0) {
      const uniqueImages = Array.from(new Set(productImages)) as string[];
      const imageRows = uniqueImages.map((imageurl, index) => ({
        productid: id,
        productvariantid: null,
        imageurl,
        isprimary: index === 0,
        sortorder: index
      }));

      const { error: productImagesError } = await supabase
        .from('product_images')
        .insert(imageRows);

      if (productImagesError) {
        console.error('Error creating product images:', productImagesError);
        return NextResponse.json(
          { error: productImagesError.message },
          { status: 500 }
        );
      }
    }

    // Handle variants
    if (Variants.length > 0) {
      // Delete existing variant images first (cascade doesn't work on productvariantid FK)
      await supabase
        .from('product_images')
        .delete()
        .eq('productid', id)
        .not('productvariantid', 'is', null); // Only delete variant-specific images
      
      // Delete existing variants (cascade will delete property values)
      const { error: deleteError } = await supabase
        .from('product_variants')
        .delete()
        .eq('productid', id);
      
      if (deleteError) {
        console.error('❌ Error deleting existing variants:', deleteError);
      } else {
        console.log('✅ Deleted existing variants and their images');
      }

      // Batch create all variants at once
      if (uniqueVariants.length > 0) {
        const variantRows = uniqueVariants.map((variantData) => ({
          productid: id,
          sku: variantData.sku,
          price: variantData.price,
          quantity: variantData.quantity,
          trackquantity: variantData.trackquantity ?? true,
          isvisible: variantData.isvisible ?? true
        }));

        const { data: createdVariants, error: variantError } = await supabase
          .from('product_variants')
          .insert(variantRows)
          .select();

        if (variantError) {
          console.error('❌ Error creating variants:', variantError);
          return NextResponse.json(
            { error: variantError.message },
            { status: 500 }
          );
        }

        // Batch insert all property values
        const allPropertyValues: any[] = [];
        createdVariants.forEach((variant, index) => {
          const variantData = uniqueVariants[index];
          const propertyvalues = variantData.propertyvalues || [];
          
          propertyvalues.forEach((pv: any) => {
            allPropertyValues.push({
              productvariantid: variant.productvariantid,
              propertyid: pv.propertyid,
              value: pv.value
            });
          });
        });

        if (allPropertyValues.length > 0) {
          const { error: pvError } = await supabase
            .from('product_variant_property_values')
            .insert(allPropertyValues);

          if (pvError) {
            console.error('Error creating property values:', pvError);
          }
        }

        // Batch insert all variant images
        const allVariantImages: any[] = [];
        createdVariants.forEach((variant, index) => {
          const variantData = uniqueVariants[index];
          const { imageurl, images, IsPrimaryImage } = variantData;
          
          // Handle variant images - prioritize images array, fall back to imageurl
          const variantImages = images && Array.isArray(images) && images.length > 0 
            ? images 
            : imageurl 
              ? [imageurl] 
              : [];

          if (variantImages.length > 0) {
            variantImages.forEach((imgUrl: string, imgIndex: number) => {
              allVariantImages.push({
                productid: id,
                productvariantid: variant.productvariantid,
                imageurl: imgUrl,
                isprimary: (IsPrimaryImage && imgIndex === 0) || imgIndex === 0,
                sortorder: imgIndex
              });
            });
          }
        });

        if (allVariantImages.length > 0) {
          const { error: imageError } = await supabase
            .from('product_images')
            .insert(allVariantImages);

          if (imageError) {
            console.error('❌ Error creating variant images:', imageError);
          } else {
            console.log(`✅ Saved ${allVariantImages.length} variant image(s) in batch`);
          }
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

    // Soft delete product by setting isdeleted = true
    const { error } = await supabase
      .from('products')
      .update({ isdeleted: true, updatedat: new Date().toISOString() })
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
