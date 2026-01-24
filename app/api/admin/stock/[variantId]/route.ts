export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const { variantId } = await params;
    const body = await request.json();
    const { quantity, action } = body;

    // Validate input
    if (quantity === undefined && action === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either quantity or action is required'
        },
        { status: 400 }
      );
    }

    // Fetch current variant
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
          error: 'Variant not found'
        },
        { status: 404 }
      );
    }

    let newQuantity: number;

    // Calculate new quantity based on action
    if (action === 'add') {
      newQuantity = (variant.quantity || 0) + (quantity || 0);
    } else if (action === 'remove') {
      newQuantity = Math.max(0, (variant.quantity || 0) - (quantity || 0));
    } else if (action === 'set' || action === undefined) {
      // If action is 'set' or not provided, use quantity directly
      newQuantity = quantity !== undefined ? quantity : variant.quantity || 0;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Must be one of: set, add, remove'
        },
        { status: 400 }
      );
    }

    // Validate quantity is not negative
    if (newQuantity < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quantity cannot be negative'
        },
        { status: 400 }
      );
    }

    // Update the variant quantity
    const { data: updatedVariant, error: updateError } = await supabaseAdmin
      .from('product_variants')
      .update({
        quantity: newQuantity,
        updatedat: new Date().toISOString()
      })
      .eq('productvariantid', variantId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating variant:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update variant quantity'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      variant: updatedVariant
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
