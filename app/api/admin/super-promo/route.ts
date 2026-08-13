export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { enrichSuperPromoItems, type SuperPromoItemRow } from '@/lib/super-promo';
import { roundMoney } from '@/lib/product-promo';
import { logger } from '@/lib/logger';
import { apiErrorResponse } from '@/lib/api-error';

function validateInput(body: {
  productid?: unknown;
  productvariantid?: unknown;
  promoprice?: unknown;
  sortorder?: unknown;
  isactive?: unknown;
}): { ok: true; data: Omit<SuperPromoItemRow, 'superpromoid' | 'createdat' | 'updatedat'> } | { ok: false; error: string } {
  const productid = typeof body.productid === 'string' ? body.productid.trim() : '';
  const productvariantid = typeof body.productvariantid === 'string' ? body.productvariantid.trim() : '';
  const promoPrice = roundMoney(Number(body.promoprice));
  const sortorder = Number.isFinite(Number(body.sortorder)) ? Number(body.sortorder) : 0;
  const isactive = body.isactive !== undefined ? Boolean(body.isactive) : true;

  if (!productid) return { ok: false, error: 'Product is required' };
  if (!productvariantid) return { ok: false, error: 'Variant is required' };
  if (!Number.isFinite(promoPrice) || promoPrice <= 0) {
    return { ok: false, error: 'Promo price must be greater than 0' };
  }

  return {
    ok: true,
    data: {
      productid,
      productvariantid,
      promoprice: promoPrice,
      sortorder,
      isactive,
    },
  };
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('super_promo_items')
      .select('*')
      .order('sortorder', { ascending: true })
      .order('createdat', { ascending: false });

    if (error) {
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
    }

    const items = await enrichSuperPromoItems(supabaseAdmin, data || []);

    return NextResponse.json({
      success: true,
      items,
      rows: data || [],
    });
  } catch (error) {
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = validateInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    const { data: variant } = await supabaseAdmin
      .from('product_variants')
      .select('productid, price')
      .eq('productvariantid', parsed.data.productvariantid)
      .single();

    if (!variant) {
      return NextResponse.json({ success: false, error: 'Variant not found' }, { status: 404 });
    }

    if (variant.productid !== parsed.data.productid) {
      return NextResponse.json(
        { success: false, error: 'Variant does not belong to selected product' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('super_promo_items')
      .insert({
        ...parsed.data,
        updatedat: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'This variant is already in SUPER PROMO' },
          { status: 409 }
        );
      }
      logger.error('Failed to create super promo item', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
    }

    const [item] = await enrichSuperPromoItems(supabaseAdmin, [data]);

    return NextResponse.json({
      success: true,
      row: data,
      item,
    });
  } catch (error) {
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const superpromoid = typeof body.superpromoid === 'string' ? body.superpromoid.trim() : '';

    if (!superpromoid) {
      return NextResponse.json({ success: false, error: 'SUPER PROMO ID is required' }, { status: 400 });
    }

    const parsed = validateInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    const { data: variant } = await supabaseAdmin
      .from('product_variants')
      .select('productid')
      .eq('productvariantid', parsed.data.productvariantid)
      .single();

    if (!variant) {
      return NextResponse.json({ success: false, error: 'Variant not found' }, { status: 404 });
    }

    if (variant.productid !== parsed.data.productid) {
      return NextResponse.json(
        { success: false, error: 'Variant does not belong to selected product' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('super_promo_items')
      .update({
        ...parsed.data,
        updatedat: new Date().toISOString(),
      })
      .eq('superpromoid', superpromoid)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'This variant is already in SUPER PROMO' },
          { status: 409 }
        );
      }
      logger.error('Failed to update super promo item', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'SUPER PROMO item not found' }, { status: 404 });
    }

    const [item] = await enrichSuperPromoItems(supabaseAdmin, [data]);

    return NextResponse.json({
      success: true,
      row: data,
      item,
    });
  } catch (error) {
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('super_promo_items').delete().eq('superpromoid', id);

    if (error) {
      logger.error('Failed to delete super promo item', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
  }
}
