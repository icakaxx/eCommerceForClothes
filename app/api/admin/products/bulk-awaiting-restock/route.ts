export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { apiErrorResponse } from '@/lib/api-error';


/** Bulk set awaitingrestock for multiple products. */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const productIds = body.productIds as unknown;
    const awaitingrestock = body.awaitingrestock as unknown;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'productIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (typeof awaitingrestock !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'awaitingrestock must be a boolean' },
        { status: 400 }
      );
    }

    const ids = productIds.filter((id): id is string => typeof id === 'string' && id.length > 0);
    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid product IDs provided' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        awaitingrestock,
        updatedat: new Date().toISOString(),
      })
      .in('productid', ids)
      .neq('isdeleted', true)
      .select('productid');

    if (error) {
      logger.error('Bulk awaitingrestock update error:', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error });
    }

    return NextResponse.json({
      success: true,
      updated: data?.length ?? 0,
      awaitingrestock,
    });
  } catch (error) {
    logger.error('Bulk awaitingrestock update failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
