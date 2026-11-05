export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { searchEcontOffices } from '@/lib/econt/nomenclatures';
import { isEcontConfigured } from '@/lib/econt/config';
import { toPublicEcontOffice } from '@/lib/econt/city-search';
import { formatEcontOfficeAddress } from '@/lib/econt/office-display';
import { allowPublicEcontLookup } from '@/lib/econt/public-rate-limit';
import { getClientIp } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  if (!allowPublicEcontLookup(getClientIp(request))) {
    return NextResponse.json(
      { success: false, error: 'Твърде много заявки. Опитайте отново след малко.' },
      { status: 429 }
    );
  }

  if (!isEcontConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'В момента не можем да заредим офисите на Еконт. Опитайте отново.',
      },
      { status: 503 }
    );
  }

  const cityId = Number(request.nextUrl.searchParams.get('cityId'));
  if (!Number.isInteger(cityId) || cityId <= 0) {
    return NextResponse.json(
      { success: false, error: 'Моля, изберете град от списъка.' },
      { status: 400 }
    );
  }

  const q = String(request.nextUrl.searchParams.get('q') ?? '').slice(0, 80);

  try {
    const offices = await searchEcontOffices(cityId, q, 150);
    return NextResponse.json({
      success: true,
      offices: offices.map((office) =>
        toPublicEcontOffice(office, formatEcontOfficeAddress(office))
      ),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'В момента не можем да заредим офисите на Еконт. Опитайте отново.',
      },
      { status: 503 }
    );
  }
}
