export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    const { id } = await context.params;
    const body = await request.json();

    const displayName = String(body.displayName ?? '').trim();
    const firstName = String(body.firstName ?? '').trim();
    const lastName = String(body.lastName ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const officeCode = body.officeCode as string | undefined;
    const cityId = body.cityId as number | undefined;
    const cityName = String(body.cityName ?? '').trim();

    if (!displayName || !firstName || !lastName || !phone || !officeCode) {
      return structuredAdminErrorResponse({
        code: 'VALIDATION_FAILED',
        title: 'Непълни данни',
        message: 'Попълнете име, телефон, показвано име и изберете град/офис от Econt.',
        retryable: false,
        status: 400,
      });
    }

    if (!cityId) {
      return structuredAdminErrorResponse({
        code: 'VALIDATION_FAILED',
        title: 'Липсва град',
        message: 'Изберете населено място от списъка на Econt (не само текст).',
        retryable: false,
        status: 400,
      });
    }

    if (body.isDefault) {
      await supabaseAdmin.from('econt_sender_profiles').update({ is_default: false }).eq('is_default', true);
    }

    const { data, error } = await supabaseAdmin
      .from('econt_sender_profiles')
      .update({
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
        phone,
        email: body.email ?? null,
        city_id: cityId,
        city_name: cityName,
        office_code: officeCode,
        office_name: (body.officeName as string) || officeCode,
        is_default: Boolean(body.isDefault),
        is_active: body.isActive !== false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return structuredAdminErrorResponse({
        code: 'DB_ERROR',
        title: 'Грешка при обновяване',
        message: 'Не успяхме да обновим профила.',
        retryable: true,
        status: 500,
      });
    }
    return NextResponse.json({ success: true, sender: data });
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    const { id } = await context.params;
    const { error } = await supabaseAdmin
      .from('econt_sender_profiles')
      .update({ is_active: false, is_default: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      return structuredAdminErrorResponse({
        code: 'DB_ERROR',
        title: 'Грешка',
        message: 'Не успяхме да деактивираме профила.',
        retryable: true,
        status: 500,
      });
    }
    return NextResponse.json({ success: true });
  });
}
