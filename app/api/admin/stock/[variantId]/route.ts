export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { adjustVariantQuantityByDelta } from '@/lib/admin-order-stock';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const { variantId } = await params;
    const body = await request.json();
    const { quantity, action, note, movementType } = body as {
      quantity?: number;
      action?: string;
      note?: string;
      movementType?: string;
    };

    if (quantity === undefined && action === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either quantity or action is required',
        },
        { status: 400 }
      );
    }

    const { data: variant, error: fetchError } = await supabaseAdmin
      .from('product_variants')
      .select('quantity, productvariantid')
      .eq('productvariantid', variantId)
      .single();

    if (fetchError || !variant) {
      console.error('Error fetching variant:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Variant not found',
        },
        { status: 404 }
      );
    }

    const currentQuantity = Number(variant.quantity) || 0;
    let delta = 0;

    if (action === 'add') {
      delta = quantity || 0;
    } else if (action === 'remove') {
      delta = -(quantity || 0);
    } else if (action === 'set' || action === undefined) {
      const target = quantity !== undefined ? quantity : currentQuantity;
      delta = target - currentQuantity;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Must be one of: set, add, remove',
        },
        { status: 400 }
      );
    }

    if (delta === 0) {
      return NextResponse.json({
        success: true,
        variant,
      });
    }

    const mt = movementType || (action === 'add' ? 'stock_in' : 'manual_adjustment');

    const res = await adjustVariantQuantityByDelta({
      productvariantid: variantId,
      delta,
      movement_type: mt,
      note: note ?? null,
      allowNegative: true,
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: res.error || 'Failed to update variant quantity',
        },
        { status: 400 }
      );
    }

    const { data: updatedVariant } = await supabaseAdmin
      .from('product_variants')
      .select('*')
      .eq('productvariantid', variantId)
      .single();

    return NextResponse.json({
      success: true,
      variant: updatedVariant,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
