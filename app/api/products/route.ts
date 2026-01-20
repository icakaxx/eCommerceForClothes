import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Type-safe Supabase client for this module
const getSupabase = () => supabaseAdmin as any;

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

// GET - Fetch all products with variants and images
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const rfproducttypeid = searchParams.get('rfproducttypeid');
    const propertyid = searchParams.get('propertyid');
    const basic = searchParams.get('basic') === 'true';
    const producttypeid = searchParams.get('producttypeid');
    const excludeId = searchParams.get('excludeId');
    const limit = searchParams.get('limit');

    // Build query
    let query = supabase
      .from('products')
      .select(`
        *,
        product_types(*)
      `)
      .neq('isdeleted', true);

    // Filter by rfproducttypeid if provided
    if (rfproducttypeid) {
      query = query.eq('rfproducttypeid', parseInt(rfproducttypeid));
    }

    // Filter by product type if provided
    if (producttypeid) {
      query = query.eq('producttypeid', producttypeid);
    }

    if (propertyid) {
      const { data: productPropertyValues, error: propertyValuesError } = await supabase
        .from('product_property_values')
        .select('productid')
        .eq('propertyid', propertyid);

      if (propertyValuesError) {
        console.error('Error fetching product property values:', propertyValuesError);
        return NextResponse.json(
          { error: propertyValuesError.message },
          { status: 500 }
        );
      }

      const { data: variantPropertyValues, error: variantPropertyError } = await supabase
        .from('product_variant_property_values')
        .select('product_variants(productid)')
        .eq('propertyid', propertyid);

      if (variantPropertyError) {
        console.error('Error fetching product variant property values:', variantPropertyError);
        return NextResponse.json(
          { error: variantPropertyError.message },
          { status: 500 }
        );
      }

      const productIds = new Set<string>();
      (productPropertyValues || []).forEach((row: any) => {
        if (row.productid) productIds.add(row.productid);
      });
      (variantPropertyValues || []).forEach((row: any) => {
        const productId = row.product_variants?.productid;
        if (productId) productIds.add(productId);
      });

      const productIdList = Array.from(productIds);
      if (productIdList.length === 0) {
        return NextResponse.json({
          success: true,
          products: []
        });
      }

      if (basic) {
        const { data: basicProducts, error: basicError } = await supabase
          .from('products')
          .select('productid,name')
          .in('productid', productIdList)
          .neq('isdeleted', true)
          .order('name', { ascending: true });

        if (basicError) {
          console.error('Error fetching basic products:', basicError);
          return NextResponse.json(
            { error: basicError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          products: basicProducts || []
        });
      }

      query = query.in('productid', productIdList);
    }
    // Exclude specific product ID (for related products)
    if (excludeId) {
      query = query.neq('productid', excludeId);
    }

    // Filter by isfeatured if provided
    const isFeatured = searchParams.get('isfeatured');
    if (isFeatured === 'true') {
      query = query.eq('isfeatured', true);
    }

    // Apply limit if provided
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: products, error: productsError } = await query
      .order('createdat', { ascending: false });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: productsError.message },
        { status: 500 }
      );
    }

    // For each product, get variants and images
    const productsWithDetails = await Promise.all(
      (products || []).map(async (product: any) => {
        // Get variants
        const { data: variants } = await supabase
          .from('product_variants')
          .select(`
            *,
            product_variant_property_values(
              *,
              properties(*)
            )
          `)
          .eq('productid', product.productid);

        // Get images
        const { data: images } = await supabase
          .from('product_images')
          .select('*')
          .eq('productid', product.productid)
          .order('sortorder', { ascending: true });

        // For backwards compatibility, create a "legacy" product from the first variant
        const firstVariant = variants?.[0];
        
        // Extract property values from variant for easy access
        const variantProperties = firstVariant?.product_variant_property_values?.reduce((acc: Record<string, string>, pv: any) => {
          if (pv.properties?.name) {
            acc[pv.properties.name] = pv.value;
          }
          return acc;
        }, {}) || {};
        
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
        const category = categoryMap[product.product_types?.code?.toLowerCase() || ''] || 'clothes';

        const productImages = (images || []).filter((img: any) => !img.productvariantid);
        const productImageUrls = productImages.map((img: any) => img.imageurl).filter(Boolean);

        const legacyProduct = {
          // New schema fields
          ...product,
          variants: variants || [],
          productTypeID: product.producttypeid,
          isfeatured: product.isfeatured || false,

          // Legacy fields for backwards compatibility
          id: product.productid,
          brand: brand,
          model: model,
          category: category,
          type: product.product_types?.name || '',
          color: variantProperties.color || variantProperties.colour || '',
          size: variantProperties.size || '',
          price: firstVariant?.price || 0,
          quantity: firstVariant?.quantity || 0,
          visible: firstVariant?.isvisible ?? true,
          images: productImageUrls.length > 0 ? productImageUrls : ['/image.png'],
          description: product.description || '',
          subtitle: product.subtitle || '',
          propertyValues: variantProperties
        };

        return legacyProduct;
      })
    );

    return NextResponse.json({
      success: true,
      products: productsWithDetails
    });

  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new product with variants
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();

    console.log('📝 POST /api/products - Received body:', JSON.stringify(body, null, 2));

    const { name, sku, description, subtitle, producttypeid, rfproducttypeid, isfeatured, Variants = [] } = body;
    const productImages = Array.isArray(body.productImages) ? body.productImages.filter(Boolean) : [];

    // Ensure SKUs are unique before creating variants
    const uniqueVariants = await ensureUniqueSKUs(Variants, supabase);


    if (!name || !producttypeid) {
      return NextResponse.json(
        { error: 'Missing required fields: name, producttypeid' },
        { status: 400 }
      );
    }

    Variants.forEach((v: any, i: number) => {
      console.log(`  Variant ${i}:`, {
        sku: v.sku,
        price: v.price,
        quantity: v.quantity,
        propertyvalues: v.propertyvalues
      });
    });

    // Create the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        sku,
        description,
        subtitle: subtitle || null,
        producttypeid,
        rfproducttypeid: rfproducttypeid || 1, // Default to 1 (For Him) if not provided
        isfeatured: isfeatured || false,
        updatedat: new Date().toISOString()
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

    if (productImages.length > 0) {
      const uniqueImages = Array.from(new Set(productImages)) as string[];
      const imageRows = uniqueImages.map((imageurl, index) => ({
        productid: product.productid,
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
      }
    }

      // Batch create all variants at once
      if (uniqueVariants.length > 0) {
        const variantRows = uniqueVariants.map((variantData) => ({
          productid: product.productid,
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
        createdVariants.forEach((variant: any, index: number) => {
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
        createdVariants.forEach((variant: any, index: number) => {
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
                productid: product.productid,
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

    return NextResponse.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}