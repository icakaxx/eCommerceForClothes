export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    const { id } = await context.params;
    const body = await request.json();

    if (body.isDefault) {
      await supabaseAdmin.from('econt_sender_profiles').update({ is_default: false }).eq('is_default', true);
    }

    const { data, error } = await supabaseAdmin
      .from('econt_sender_profiles')
      .update({
        display_name: body.displayName,
        first_name: body.firstName,
        last_name: body.lastName,
        phone: body.phone,
        email: body.email,
        city_id: body.cityId,
        city_name: body.cityName,
        office_code: body.officeCode,
        office_name: body.officeName,
        is_default: body.isDefault,
        is_active: body.isActive,
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
