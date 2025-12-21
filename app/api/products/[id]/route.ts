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
      const variantImage = allImages?.find(img => img.productvariantid === variant.productvariantid);
      const variantData = {
        ...variant,
        imageurl: variantImage?.imageurl,
        IsPrimaryImage: variantImage?.IsPrimary || false
      };
      
      // Debug: Log the variant structure to ensure property values are preserved
      if (variant.ProductVariantPropertyvalues) {
        console.log(`✅ Variant ${variant.productvariantid} has ${variant.ProductVariantPropertyvalues.length} property values`);
      } else {
        console.log(`⚠️ Variant ${variant.productvariantid} has NO property values`);
      }
      
      return variantData;
    });

    // Get general product images (not variant-specific)
    const images = allImages?.filter(img => !img.productvariantid) || [];

    // Transform to new format with backwards compatibility
    const firstVariant = variants?.[0];
    
    // Extract property values from variant for easy access
    const variantProperties: Record<string, string> = {};
    // Handle both naming conventions (lowercase 'v' from Supabase query)
    const firstVariantProps = firstVariant?.ProductVariantPropertyvalues || firstVariant?.ProductVariantPropertyValues || [];
    firstVariantProps.forEach((pv: any) => {
      const propName = pv.Property?.name || pv.property?.name;
      const propValue = pv.value || pv.Value;
      if (propName && propValue) {
        variantProperties[propName.toLowerCase()] = propValue;
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
      subtitle,
      producttypeid,
      rfproducttypeid,
      isfeatured,
      Variants = []
    } = body;

    console.log('📦 Variants to process:', Variants.length);
    Variants.forEach((v: any, i: number) => {
      console.log(`  Variant ${i}:`, {
        sku: v.sku,
        price: v.price,
        quantity: v.quantity,
        propertyvalues: v.propertyvalues
      });
    });

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

      // Create new variants
      for (const variantData of Variants) {
        const {
          productvariantid, // May be present for updates
          sku: variantsku,
          price,
          compareatprice,
          cost,
          quantity,
          weight,
          weightunit,
          barcode,
          trackquantity,
          continuesellingwhenoutofstock,
          isvisible,
          propertyvalues = [],
          imageurl,
          IsPrimaryImage
        } = variantData;

        console.log('🔨 Attempting to insert variant:', {
          productid: id,
          sku: variantsku,
          price,
          quantity,
          weightunit: weightunit || 'kg',
          trackquantity: trackquantity ?? true,
          isvisible: isvisible ?? true
        });

        // Create variant
        const { data: variant, error: variantError } = await supabase
          .from('product_variants')
          .upsert({
            productid: id,
            sku: variantsku,
            price,
            compareatprice,
            cost,
            quantity,
            weight,
            weightunit: weightunit || 'kg',
            barcode,
            trackquantity: trackquantity ?? true,
            continuesellingwhenoutofstock: continuesellingwhenoutofstock ?? false,
            isvisible: isvisible ?? true
          }, {
            onConflict: 'sku',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (variantError) {
          console.error('❌ Error creating variant:', variantError);
          console.error('❌ Error details:', JSON.stringify(variantError, null, 2));
          continue;
        }

        console.log('✅ Created variant:', variant);

        // Create/update property values for this variant
        if (propertyvalues.length > 0) {
          // First, delete existing property values for this variant
          await supabase
            .from('product_variant_property_values')
            .delete()
            .eq('productvariantid', variant.productvariantid);

          // Then insert the new property values
          const propertyvaluesData = propertyvalues.map((pv: any) => ({
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
              isprimary: IsPrimaryImage || false,
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
