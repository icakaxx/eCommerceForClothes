export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

const ALLOWED = new Set([
  'contact_needed',
  'contact_completed',
  'internal_note',
  'stock_verified',
  'cash_receipt_confirmed',
  'cash_receipt_reversed',
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (admin) => {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const actionType = String(body.actionType ?? '');
    if (!ALLOWED.has(actionType)) {
      return structuredAdminErrorResponse({
        code: 'VALIDATION_FAILED',
        title: 'Невалидно действие',
        message: 'Това вътрешно действие не се поддържа.',
        retryable: false,
        status: 400,
      });
    }

    const note = body.note ? String(body.note).slice(0, 1000) : null;
    const { error } = await supabaseAdmin.from('econt_shipment_actions').insert({
      shipment_id: id,
      action_type: actionType,
      note,
      performed_by: admin.id,
    });

    if (error) {
      return structuredAdminErrorResponse({
        code: 'DB_ERROR',
        title: 'Бележката не е записана',
        message: 'Таблицата за вътрешни действия липсва или записът е отказан. Пуснете migration-add-econt-tracking-ops.sql.',
        retryable: false,
        status: 500,
      });
    }

    if (actionType === 'contact_needed' || actionType === 'contact_completed') {
      await supabaseAdmin
        .from('econt_shipments')
        .update({ contact_state: actionType })
        .eq('id', id);
    }

    return NextResponse.json({ success: true });
  });
}
