export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { translations } from '@/lib/translations';

// Rate limiting cache (in production, use Redis or similar)
const rateLimitCache = new Map<string, { attempts: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 10; // Max validation attempts per minute
const WINDOW_MS = 60 * 1000; // 1 minute window

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitCache.entries()) {
    if (now - data.lastAttempt > WINDOW_MS) {
      rateLimitCache.delete(key);
    }
  }
}, WINDOW_MS / 2);

// Rate limiting check
function checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const key = `discount_validation_${identifier}`;

  const existing = rateLimitCache.get(key);
  if (!existing || (now - existing.lastAttempt) > WINDOW_MS) {
    // First attempt or window expired
    rateLimitCache.set(key, { attempts: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  if (existing.attempts >= MAX_ATTEMPTS) {
    return { allowed: false, remainingAttempts: 0 };
  }

  existing.attempts++;
  existing.lastAttempt = now;
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - existing.attempts };
}

// Input sanitization
function sanitizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({
        success: false,
        error: translations.en.discountCodeRequiredMsg
      }, { status: 400 });
    }

    // Rate limiting check using IP address
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        error: 'Too many validation attempts. Please try again later.',
        retryAfter: WINDOW_MS / 1000
      }, { status: 429 });
    }

    // Sanitize and validate code format
    const sanitizedCode = sanitizeCode(code);
    if (sanitizedCode.length < 3 || sanitizedCode.length > 50) {
      return NextResponse.json({
        success: false,
        error: translations.en.discountCodeFormatError
      }, { status: 400 });
    }

    // Fetch discount from database
    const { data: discount, error } = await supabaseAdmin
      .from('discounts')
      .select('*')
      .eq('code', sanitizedCode)
      .eq('isactive', true)
      .single();

    if (error || !discount) {
      return NextResponse.json({
        success: false,
        error: translations.en.invalidDiscountCode
      }, { status: 400 });
    }

    // Check expiry date
    if (discount.expiresat && new Date(discount.expiresat) <= new Date()) {
      return NextResponse.json({
        success: false,
        error: translations.en.expiredDiscountCode
      }, { status: 400 });
    }

    // Calculate discount amount
    let discountAmount = 0;
    let finalTotal = cartTotal || 0;

    if (discount.type === 'percentage') {
      discountAmount = (cartTotal * discount.value) / 100;
    } else if (discount.type === 'fixed') {
      discountAmount = Math.min(discount.value, cartTotal); // Don't allow discount > cart total
    }

    finalTotal = Math.max(0, cartTotal - discountAmount);

    return NextResponse.json({
      success: true,
      discount: {
        code: discount.code,
        description: discount.description,
        type: discount.type,
        value: discount.value,
        discountAmount: discountAmount,
        finalTotal: finalTotal
      },
      remainingAttempts: rateLimit.remainingAttempts
    });

  } catch (error) {
    console.error('Discount validation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
