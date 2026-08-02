import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { apiErrorResponse } from '@/lib/api-error';


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
    logger.error('Failed to get product type:', error);
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
          logger.error('Error checking parent products:', productsError);
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
        logger.error('Error checking current category children:', childrenError);
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
      logger.error('Error updating product type:', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error });
    }

    return NextResponse.json({
      success: true,
      productType
    });

  } catch (error) {
    logger.error('Failed to update product type:', error);
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
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
      logger.error('Error loading products for product type:', productsForTypeError);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: productsForTypeError });
    }

    const productIds = (productsForType || []).map((product) => product.productid);

    if (productIds.length > 0) {
      // Delete favorite_products first to avoid foreign key constraint violation
      const { error: favoriteProductsError } = await supabase
        .from('favorite_products')
        .delete()
        .in('productid', productIds);

      if (favoriteProductsError) {
        logger.error('Error deleting favorite products:', favoriteProductsError);
        return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: favoriteProductsError });
      }

      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('productvariantid')
        .in('productid', productIds);

      if (variantsError) {
        logger.error('Error loading variants for product type:', variantsError);
        return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: variantsError });
      }

      const variantIds = (variants || []).map((variant) => variant.productvariantid);

      const { error: relatedProductsError } = await supabase
        .from('related_products')
        .delete()
        .in('productid', productIds);

      if (relatedProductsError) {
        logger.error('Error deleting related products (productid):', relatedProductsError);
        return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: relatedProductsError });
      }

      const { error: relatedProductRefsError } = await supabase
        .from('related_products')
        .delete()
        .in('relatedproductid_ref', productIds);

      if (relatedProductRefsError) {
        logger.error('Error deleting related products (relatedproductid_ref):', relatedProductRefsError);
        return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: relatedProductRefsError });
      }

      const { error: productImagesError } = await supabase
        .from('product_images')
        .delete()
        .in('productid', productIds);

      if (productImagesError) {
        logger.error('Error deleting product images:', productImagesError);
        return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: productImagesError });
      }

      if (variantIds.length > 0) {
        const { error: variantPropertyValuesError } = await supabase
          .from('product_variant_property_values')
          .delete()
          .in('productvariantid', variantIds);

        if (variantPropertyValuesError) {
          logger.error('Error deleting variant property values:', variantPropertyValuesError);
          return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: variantPropertyValuesError });
        }
      }

      const { error: productPropertyValuesError } = await supabase
        .from('product_property_values')
        .delete()
        .in('productid', productIds);

      if (productPropertyValuesError) {
        logger.error('Error deleting product property values:', productPropertyValuesError);
        return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: productPropertyValuesError });
      }

      const { error: variantsDeleteError } = await supabase
        .from('product_variants')
        .delete()
        .in('productid', productIds);

      if (variantsDeleteError) {
        logger.error('Error deleting product variants:', variantsDeleteError);
        return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: variantsDeleteError });
      }

      const { error: productsDeleteError } = await supabase
        .from('products')
        .delete()
        .in('productid', productIds);

      if (productsDeleteError) {
        logger.error('Error deleting products for product type:', productsDeleteError);
        return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: productsDeleteError });
      }
    }

    const { error: linksError } = await supabase
      .from('product_type_properties')
      .delete()
      .eq('producttypeid', id);

    if (linksError) {
      logger.error('Error deleting product type properties:', linksError);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: linksError });
    }

    const { error } = await supabase
      .from('product_types')
      .delete()
      .eq('producttypeid', id);

    if (error) {
      logger.error('Error deleting product type:', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error });
    }

    return NextResponse.json({
      success: true,
      message: 'Product type deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete product type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




