export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, structuredAdminErrorResponse } from '@/lib/admin-api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { findLovechMarketOffice, findCityByName } from '@/lib/econt/nomenclatures';
import { toStructuredError } from '@/lib/econt/errors';

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    let query = supabaseAdmin.from('econt_sender_profiles').select('*').order('updated_at', { ascending: false });
    if (q) {
      query = query.or(`display_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
    }
    const { data, error } = await query;
    if (error) {
      return structuredAdminErrorResponse({
        code: 'DB_ERROR',
        title: 'Грешка при зареждане',
        message: 'Не успяхме да заредим профилите на податели.',
        retryable: true,
        status: 500,
      });
    }
    return NextResponse.json({ success: true, senders: data ?? [] });
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (admin) => {
    try {
      const body = await request.json();
      let officeCode = body.officeCode as string | undefined;
      let officeName = body.officeName as string | undefined;
      let cityId = body.cityId as number | undefined;
      let cityName = (body.cityName as string) || 'Ловеч';

      if (!officeCode && body.useLovechDefault) {
        // Demo preset: avoid blocking create on the full Econt cities download (~18MB).
        officeCode = '5503';
        officeName = 'Ловеч — офис пазар (5503)';
        cityId = 24;
        cityName = 'Ловеч';
        try {
          const office = await findLovechMarketOffice();
          if (office) {
            officeCode = office.code;
            officeName = office.name;
            const city = (await findCityByName('Ловеч')) ?? (await findCityByName('Lovech'));
            if (city) {
              cityId = city.id;
              cityName = city.name;
            }
          }
        } catch {
          // Keep demo defaults above when Econt is unreachable or not configured.
        }
      }

      if (!officeCode || !body.firstName || !body.lastName || !body.phone || !body.displayName) {
        return structuredAdminErrorResponse({
          code: 'VALIDATION_FAILED',
          title: 'Непълни данни',
          message: 'Попълнете име, телефон, офис и показвано име.',
          retryable: false,
          status: 400,
        });
      }

      if (body.isDefault) {
        await supabaseAdmin.from('econt_sender_profiles').update({ is_default: false }).eq('is_default', true);
      }

      const { data, error } = await supabaseAdmin
        .from('econt_sender_profiles')
        .insert({
          display_name: body.displayName,
          first_name: body.firstName,
          last_name: body.lastName,
          phone: body.phone,
          email: body.email ?? null,
          city_id: cityId ?? null,
          city_name: cityName,
          office_code: officeCode,
          office_name: officeName ?? officeCode,
          is_default: Boolean(body.isDefault),
          is_active: body.isActive !== false,
        })
        .select('*')
        .single();

      if (error) {
        console.error('[econt/senders POST] insert failed:', error.message, error.code, error.details);
        return structuredAdminErrorResponse({
          code: 'DB_ERROR',
          title: 'Грешка при запис',
          message: 'Не успяхме да запазим профила.',
          suggestion: error.message,
          retryable: true,
          status: 500,
        });
      }

      return NextResponse.json({ success: true, sender: data, createdBy: admin.id });
    } catch (err) {
      const e = toStructuredError(err);
      return structuredAdminErrorResponse({
        code: e.code,
        title: e.title,
        message: e.message,
        suggestion: e.suggestion,
        retryable: e.retryable,
        status: e.httpStatus,
      });
    }
  });
}
