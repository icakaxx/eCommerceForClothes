export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Input validation helper
function validateDiscountInput(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.code || typeof data.code !== 'string') {
    errors.push('Discount code is required');
  } else if (data.code.length < 3 || data.code.length > 50) {
    errors.push('Discount code must be between 3 and 50 characters');
  } else if (!/^[A-Z0-9_-]+$/i.test(data.code)) {
    errors.push('Discount code can only contain letters, numbers, hyphens, and underscores');
  }

  if (!data.type || !['percentage', 'fixed'].includes(data.type)) {
    errors.push('Discount type must be either "percentage" or "fixed"');
  }

  const value = parseFloat(data.value);
  if (isNaN(value) || value <= 0) {
    errors.push('Discount value must be a positive number');
  } else if (data.type === 'percentage' && value > 100) {
    errors.push('Percentage discount cannot exceed 100%');
  }

  if (data.expiresat) {
    const expiryDate = new Date(data.expiresat);
    if (isNaN(expiryDate.getTime())) {
      errors.push('Invalid expiry date format');
    } else if (expiryDate <= new Date()) {
      errors.push('Expiry date must be in the future');
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Sanitize input to prevent SQL injection and XSS
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>\"'&]/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const { data: discounts, error } = await supabaseAdmin
      .from('discounts')
      .select('*')
      .order('createdat', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch discounts'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      discounts: discounts || []
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, description, type, value, isactive, expiresat } = body;

    // Validate input
    const validation = validateDiscountInput({ code, type, value, expiresat });
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedData = {
      code: sanitizeInput(code).toUpperCase(),
      description: description ? sanitizeInput(description) : null,
      type,
      value: parseFloat(value),
      isactive: isactive !== undefined ? Boolean(isactive) : true,
      expiresat: expiresat ? new Date(expiresat).toISOString() : null
    };

    // Check if code already exists
    const { data: existingDiscount } = await supabaseAdmin
      .from('discounts')
      .select('discountid')
      .eq('code', sanitizedData.code)
      .single();

    if (existingDiscount) {
      return NextResponse.json({
        success: false,
        error: 'Discount code already exists'
      }, { status: 409 });
    }

    const { data: discount, error } = await supabaseAdmin
      .from('discounts')
      .insert(sanitizedData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create discount'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      discount,
      message: 'Discount created successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { discountid, code, description, type, value, isactive, expiresat } = body;

    if (!discountid) {
      return NextResponse.json({
        success: false,
        error: 'Discount ID is required'
      }, { status: 400 });
    }

    // Validate input
    const validation = validateDiscountInput({ code, type, value, expiresat });
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedData = {
      code: sanitizeInput(code).toUpperCase(),
      description: description ? sanitizeInput(description) : null,
      type,
      value: parseFloat(value),
      isactive: isactive !== undefined ? Boolean(isactive) : true,
      expiresat: expiresat ? new Date(expiresat).toISOString() : null,
      updatedat: new Date().toISOString()
    };

    // Check if another discount with the same code exists
    const { data: existingDiscount } = await supabaseAdmin
      .from('discounts')
      .select('discountid')
      .eq('code', sanitizedData.code)
      .neq('discountid', discountid)
      .single();

    if (existingDiscount) {
      return NextResponse.json({
        success: false,
        error: 'Discount code already exists'
      }, { status: 409 });
    }

    const { data: discount, error } = await supabaseAdmin
      .from('discounts')
      .update(sanitizedData)
      .eq('discountid', discountid)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update discount'
      }, { status: 500 });
    }

    if (!discount) {
      return NextResponse.json({
        success: false,
        error: 'Discount not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      discount,
      message: 'Discount updated successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const discountid = searchParams.get('id');

    if (!discountid) {
      return NextResponse.json({
        success: false,
        error: 'Discount ID is required'
      }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('discounts')
      .delete()
      .eq('discountid', discountid);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete discount'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Discount deleted successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}


