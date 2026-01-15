import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Type-safe Supabase client for this module
const getSupabase = () => supabaseAdmin as any;

// Ensure SKUs are unique by checking database and generating alternatives if needed
async function ensureUniqueSKUs(variants: any[], supabase: any) {
  const processedVariants = [];

  for (const variant of variants) {
    let finalSKU = variant.sku;
    let counter = 1;

    // Check if SKU exists and generate unique alternative if needed
    while (true) {
      const { data: existingVariant } = await supabase
        .from('product_variants')
        .select('productvariantid')
        .eq('sku', finalSKU)
        .single();

      if (!existingVariant) {
        // SKU is unique, use it
        break;
      }

      // Generate alternative SKU
      const baseSKU = variant.sku.split('-').slice(0, -1).join('-'); // Remove last part
      finalSKU = `${baseSKU}-${counter}`;
      counter++;

      // Safety check to prevent infinite loops
      if (counter > 100) {
        finalSKU = `${variant.sku}_${Date.now()}`;
        break;
      }
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
          images: images?.map((img: any) => img.imageurl) || ['/image.png'],
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

      // Create new variants
      for (const variantData of uniqueVariants) {
        const {
          sku: variantsku,
          price,
          compareatprice,
          cost,
          quantity,
          weight,
          weightunit,
          barcode,
          trackquantity,
          isvisible,
          propertyvalues = [],
          imageurl,
          images,
          IsPrimaryImage
        } = variantData;

        // Create new variant (no upsert - variants should be unique per product)
        const { data: variant, error: variantError } = await supabase
          .from('product_variants')
          .insert({
            productid: product.productid,
            sku: variantsku,
            price,
            quantity,
            trackquantity: trackquantity ?? true,
            isvisible: isvisible ?? true
          })
          .select()
          .single();

        if (variantError) {
          console.error('❌ Error creating variant:', variantError);
          continue; // Continue with other variants
        }

        // Create/update property values for this variant
        if (propertyvalues.length > 0) {
          // First, delete existing property values for this variant
          await supabase
            .from('product_variant_property_values')
            .delete()
            .eq('productvariantid', variant.productvariantid);

          // Then insert the new property values
          const propertyValuesData = propertyvalues.map((pv: any) => ({
            productvariantid: variant.productvariantid,
            propertyid: pv.propertyid,
            value: pv.value
          }));

          const { error: pvError } = await supabase
            .from('product_variant_property_values')
            .insert(propertyValuesData);

          if (pvError) {
            console.error('Error creating property values:', pvError);
          }
        }

        // Handle variant images - prioritize images array, fall back to imageurl
        const variantImages = images && Array.isArray(images) && images.length > 0 
          ? images 
          : imageurl 
            ? [imageurl] 
            : [];

        if (variantImages.length > 0) {
          console.log('🖼️ Saving variant images:', {
            productid: product.productid,
            productvariantid: variant.productvariantid,
            imagesCount: variantImages.length,
            images: variantImages
          });
          
          // Insert all images for this variant
          const imageDataArray = variantImages.map((imgUrl, index) => ({
            productid: product.productid,
            productvariantid: variant.productvariantid,
            imageurl: imgUrl,
            isprimary: (IsPrimaryImage && index === 0) || index === 0,
            sortorder: index
          }));

          const { data: imageData, error: imageError } = await supabase
            .from('product_images')
            .insert(imageDataArray)
            .select();

          if (imageError) {
            console.error('❌ Error creating variant images:', imageError);
          } else {
            console.log(`✅ Saved ${imageData.length} variant image(s):`, imageData);
          }
        } else {
          console.log('⚠️ No images for variant:', variant.productvariantid);
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