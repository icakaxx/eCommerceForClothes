export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { syncShipmentsByIds } from '@/lib/econt/shipment-service';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    const { id } = await context.params;
    const { data: shipment, error } = await supabaseAdmin.from('econt_shipments').select('*').eq('id', id).single();
    if (error || !shipment) {
      return structuredAdminErrorResponse({
        code: 'NOT_FOUND',
        title: 'Пратката не е намерена',
        message: 'Липсва запис.',
        retryable: false,
        status: 404,
      });
    }
    const { data: events } = await supabaseAdmin
      .from('econt_tracking_events')
      .select('*')
      .eq('shipment_id', id)
      .order('event_time', { ascending: false });
    return NextResponse.json({ success: true, shipment, events: events ?? [] });
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    const { id } = await context.params;
    const body = await request.json();
    const { data: shipment } = await supabaseAdmin.from('econt_shipments').select('shipment_number').eq('id', id).single();
    if (shipment?.shipment_number) {
      return structuredAdminErrorResponse({
        code: 'SHIPMENT_LOCKED',
        title: 'Пратката е заключена',
        message: 'След създаване на товарителница не може да се променя черновата.',
        retryable: false,
        status: 409,
      });
    }
    const { data, error } = await supabaseAdmin
      .from('econt_shipments')
      .update({
        draft_config: body.draft ?? undefined,
        sender_profile_id: body.senderProfileId ?? undefined,
        weight: body.weight ?? undefined,
        updated_at: new Date().toISOString(),
        validation_state: 'none',
        validation_hash: null,
        validation_expires_at: null,
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      return structuredAdminErrorResponse({
        code: 'DB_ERROR',
        title: 'Грешка при запис',
        message: 'Не успяхме да обновим черновата.',
        retryable: true,
        status: 500,
      });
    }
    return NextResponse.json({ success: true, shipment: data });
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    const { id } = await context.params;
    const result = await syncShipmentsByIds([id]);
    return NextResponse.json({ success: true, processed: result.processed, successCount: result.success, failureCount: result.failure, environment: 'demo' });
  });
}
