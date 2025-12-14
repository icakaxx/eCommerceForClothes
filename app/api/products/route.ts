import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Type-safe Supabase client for this module
const getSupabase = () => supabaseAdmin as any;

// GET - Fetch all products with variants and images
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();

    // Get all products with their types (exclude soft-deleted)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        product_types(*)
      `)
      .neq('isdeleted', true)
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

    const { name, sku, description, producttypeid, Variants = [] } = body;

    if (!name || !producttypeid) {
      return NextResponse.json(
        { error: 'Missing required fields: name, producttypeid' },
        { status: 400 }
      );
    }

    console.log('📦 Variants to process:', Variants.length);
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
        producttypeid,
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
      for (const variantData of Variants) {
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
          continuesellingwhenoutofstock,
          isvisible,
          propertyvalues = [],
          imageurl,
          IsPrimaryImage
        } = variantData;

        // Create or update variant
        const { data: variant, error: variantError } = await supabase
          .from('product_variants')
          .upsert({
            productid: product.productid,
            sku: variantsku,
            price,
            compareatprice: compareatprice,
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
          continue; // Continue with other variants
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

        // Create image for this variant if provided
        if (imageurl) {
          console.log('🖼️ Saving variant image:', {
            productid: product.productid,
            productvariantid: variant.productvariantid,
            imageurl: imageurl,
            IsPrimary: IsPrimaryImage || false
          });
          
          const { data: imageData, error: imageError } = await supabase
            .from('product_images')
            .insert({
              productid: product.productid,
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