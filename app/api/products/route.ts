import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Fetch all products with variants and images
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Get all products with their types
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        ProductType:product_types(*)
      `)
      .order('CreatedAt', { ascending: false });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: productsError.message },
        { status: 500 }
      );
    }

    // For each product, get variants and images
    const productsWithDetails = await Promise.all(
      (products || []).map(async (product) => {
        // Get variants
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

        // Get images
        const { data: images } = await supabase
          .from('product_images')
          .select('*')
          .eq('ProductID', product.ProductID)
          .order('SortOrder', { ascending: true });

        // For backwards compatibility, create a "legacy" product from the first variant
        const firstVariant = variants?.[0];
        
        // Extract property values from variant for easy access
        const variantProperties = firstVariant?.ProductVariantPropertyValues?.reduce((acc: Record<string, string>, pv: any) => {
          if (pv.Property?.Name) {
            acc[pv.Property.Name] = pv.Value;
          }
          return acc;
        }, {}) || {};
        
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
          ...product,
          variants: variants || [],
          productTypeID: product.ProductTypeID,
          
          // Legacy fields for backwards compatibility
          id: product.ProductID,
          brand: brand,
          model: model,
          category: category,
          type: product.ProductType?.Name || '',
          color: variantProperties.color || variantProperties.colour || '',
          size: variantProperties.size || '',
          price: firstVariant?.Price || 0,
          quantity: firstVariant?.Quantity || 0,
          visible: firstVariant?.IsVisible ?? true,
          images: images?.map(img => img.ImageURL) || ['/image.png'],
          description: product.Description || '',
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
    const supabase = createServerClient();
    const body = await request.json();

    console.log('📝 POST /api/products - Received body:', JSON.stringify(body, null, 2));

    const { Name, SKU, Description, ProductTypeID, Variants = [] } = body;

    if (!Name || !ProductTypeID) {
      return NextResponse.json(
        { error: 'Missing required fields: Name, ProductTypeID' },
        { status: 400 }
      );
    }

    console.log('📦 Variants to process:', Variants.length);
    Variants.forEach((v: any, i: number) => {
      console.log(`  Variant ${i}:`, { 
        SKU: v.SKU, 
        Price: v.Price, 
        Quantity: v.Quantity,
        PropertyValues: v.PropertyValues 
      });
    });

    // Create the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        Name,
        SKU,
        Description,
        ProductTypeID,
        UpdatedAt: new Date().toISOString()
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

        // Create variant
        const { data: variant, error: variantError } = await supabase
          .from('product_variants')
          .insert({
            ProductID: product.ProductID,
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
          continue; // Continue with other variants
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
            ProductID: product.ProductID,
            ProductVariantID: variant.ProductVariantID,
            ImageURL: ImageURL,
            IsPrimary: IsPrimaryImage || false
          });
          
          const { data: imageData, error: imageError } = await supabase
            .from('product_images')
            .insert({
              ProductID: product.ProductID,
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