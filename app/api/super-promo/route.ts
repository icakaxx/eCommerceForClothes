export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { enrichSuperPromoItems } from '@/lib/super-promo';
import { apiErrorResponse } from '@/lib/api-error';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('super_promo_items')
      .select('*')
      .eq('isactive', true)
      .order('sortorder', { ascending: true })
      .order('createdat', { ascending: false });

    if (error) {
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
    }

    const items = await enrichSuperPromoItems(supabaseAdmin, data || []);

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
  }
}
