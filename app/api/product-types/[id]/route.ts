import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get single product type with properties
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    // Get product type with associated properties
    const { data: productType, error: productTypeError } = await supabase
      .from('product_types')
      .select(`
        *,
        product_type_properties (
          producttypepropertyid,
          propertyid,
          properties (
            propertyid,
            name,
            description,
            datatype
          )
        )
      `)
      .eq('producttypeid', id)
      .single();

    if (productTypeError || !productType) {
      // If join fails, try basic query without properties
      if (productTypeError?.code === 'PGRST116' || productTypeError?.message?.includes('relation')) {
        const { data: basicProductType, error: basicError } = await supabase
          .from('product_types')
          .select('*')
          .eq('producttypeid', id)
          .single();

        if (basicError || !basicProductType) {
          return NextResponse.json(
            { error: 'Product type not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          productType: { ...basicProductType, product_type_properties: [] }
        });
      }

      return NextResponse.json(
        { error: 'Product type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      productType
    });

  } catch (error) {
    console.error('Failed to get product type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update product type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const body = await request.json();

    const { name, parent_producttypeid } = body;

    // Validate parent_producttypeid if provided
    if (parent_producttypeid !== undefined) {
      if (parent_producttypeid === id) {
        return NextResponse.json(
          { error: 'Category cannot be its own parent' },
          { status: 400 }
        );
      }

      if (parent_producttypeid) {
        // Check if parent exists
        const { data: parent, error: parentError } = await supabase
          .from('product_types')
          .select('producttypeid, parent_producttypeid')
          .eq('producttypeid', parent_producttypeid)
          .single();

        if (parentError || !parent) {
          return NextResponse.json(
            { error: 'Parent category not found' },
            { status: 400 }
          );
        }

        // Check depth: if parent has a parent, we're at max depth
        if (parent.parent_producttypeid) {
          return NextResponse.json(
            { error: 'Maximum hierarchy depth of 3 levels reached. Cannot set parent to a subcategory.' },
            { status: 400 }
          );
        }

        // Check for circular reference: ensure the new parent is not a descendant of this category
        const checkCircular = async (categoryId: string, targetParentId: string): Promise<boolean> => {
          const { data: children } = await supabase
            .from('product_types')
            .select('producttypeid')
            .eq('parent_producttypeid', categoryId);

          if (!children || children.length === 0) return false;

          for (const child of children) {
            if (child.producttypeid === targetParentId) return true;
            const isCircular = await checkCircular(child.producttypeid, targetParentId);
            if (isCircular) return true;
          }
          return false;
        };

        const isCircular = await checkCircular(id, parent_producttypeid);
        if (isCircular) {
          return NextResponse.json(
            { error: 'Circular reference detected. Cannot set a descendant as parent.' },
            { status: 400 }
          );
        }

        // Check if parent has products - if so, it cannot have children
        const { data: parentProducts, error: productsError } = await supabase
          .from('products')
          .select('productid')
          .eq('producttypeid', parent_producttypeid)
          .eq('isdeleted', false)
          .limit(1);

        if (productsError) {
          console.error('Error checking parent products:', productsError);
        } else if (parentProducts && parentProducts.length > 0) {
          return NextResponse.json(
            { error: 'Parent category has products. Categories with products cannot have child categories.' },
            { status: 400 }
          );
        }
      }
    }

    // Check if this category has children - if so, it cannot have a parent (it's already a parent category)
    // Categories with children are parent categories and cannot have a parent themselves
    if (parent_producttypeid) {
      const { data: currentCategoryChildren, error: childrenError } = await supabase
        .from('product_types')
        .select('producttypeid')
        .eq('parent_producttypeid', id)
        .limit(1);

      if (childrenError) {
        console.error('Error checking current category children:', childrenError);
      } else if (currentCategoryChildren && currentCategoryChildren.length > 0) {
        return NextResponse.json(
          { error: 'This category has child categories. Parent categories cannot have a parent. Only leaf categories (categories with products) can have a parent.' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      updatedat: new Date().toISOString()
    };

    if (name !== undefined) {
      updateData.name = name;
    }

    if (parent_producttypeid !== undefined) {
      updateData.parent_producttypeid = parent_producttypeid;
    }

    const { data: productType, error } = await supabase
      .from('product_types')
      .update(updateData)
      .eq('producttypeid', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product type:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      productType
    });

  } catch (error) {
    console.error('Failed to update product type:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    const { data: productsForType, error: productsForTypeError } = await supabase
      .from('products')
      .select('productid')
      .eq('producttypeid', id);

    if (productsForTypeError) {
      console.error('Error loading products for product type:', productsForTypeError);
      return NextResponse.json(
        { error: productsForTypeError.message },
        { status: 500 }
      );
    }

    const productIds = (productsForType || []).map((product) => product.productid);

    if (productIds.length > 0) {
      // Delete favorite_products first to avoid foreign key constraint violation
      const { error: favoriteProductsError } = await supabase
        .from('favorite_products')
        .delete()
        .in('productid', productIds);

      if (favoriteProductsError) {
        console.error('Error deleting favorite products:', favoriteProductsError);
        return NextResponse.json(
          { error: favoriteProductsError.message },
          { status: 500 }
        );
      }

      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('productvariantid')
        .in('productid', productIds);

      if (variantsError) {
        console.error('Error loading variants for product type:', variantsError);
        return NextResponse.json(
          { error: variantsError.message },
          { status: 500 }
        );
      }

      const variantIds = (variants || []).map((variant) => variant.productvariantid);

      const { error: relatedProductsError } = await supabase
        .from('related_products')
        .delete()
        .in('productid', productIds);

      if (relatedProductsError) {
        console.error('Error deleting related products (productid):', relatedProductsError);
        return NextResponse.json(
          { error: relatedProductsError.message },
          { status: 500 }
        );
      }

      const { error: relatedProductRefsError } = await supabase
        .from('related_products')
        .delete()
        .in('relatedproductid_ref', productIds);

      if (relatedProductRefsError) {
        console.error('Error deleting related products (relatedproductid_ref):', relatedProductRefsError);
        return NextResponse.json(
          { error: relatedProductRefsError.message },
          { status: 500 }
        );
      }

      const { error: productImagesError } = await supabase
        .from('product_images')
        .delete()
        .in('productid', productIds);

      if (productImagesError) {
        console.error('Error deleting product images:', productImagesError);
        return NextResponse.json(
          { error: productImagesError.message },
          { status: 500 }
        );
      }

      if (variantIds.length > 0) {
        const { error: variantPropertyValuesError } = await supabase
          .from('product_variant_property_values')
          .delete()
          .in('productvariantid', variantIds);

        if (variantPropertyValuesError) {
          console.error('Error deleting variant property values:', variantPropertyValuesError);
          return NextResponse.json(
            { error: variantPropertyValuesError.message },
            { status: 500 }
          );
        }
      }

      const { error: productPropertyValuesError } = await supabase
        .from('product_property_values')
        .delete()
        .in('productid', productIds);

      if (productPropertyValuesError) {
        console.error('Error deleting product property values:', productPropertyValuesError);
        return NextResponse.json(
          { error: productPropertyValuesError.message },
          { status: 500 }
        );
      }

      const { error: variantsDeleteError } = await supabase
        .from('product_variants')
        .delete()
        .in('productid', productIds);

      if (variantsDeleteError) {
        console.error('Error deleting product variants:', variantsDeleteError);
        return NextResponse.json(
          { error: variantsDeleteError.message },
          { status: 500 }
        );
      }

      const { error: productsDeleteError } = await supabase
        .from('products')
        .delete()
        .in('productid', productIds);

      if (productsDeleteError) {
        console.error('Error deleting products for product type:', productsDeleteError);
        return NextResponse.json(
          { error: productsDeleteError.message },
          { status: 500 }
        );
      }
    }

    const { error: linksError } = await supabase
      .from('product_type_properties')
      .delete()
      .eq('producttypeid', id);

    if (linksError) {
      console.error('Error deleting product type properties:', linksError);
      return NextResponse.json(
        { error: linksError.message },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from('product_types')
      .delete()
      .eq('producttypeid', id);

    if (error) {
      console.error('Error deleting product type:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product type deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete product type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




