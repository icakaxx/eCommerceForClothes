export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { searchEcontCities } from '@/lib/econt/nomenclatures';
import { isEcontConfigured } from '@/lib/econt/config';
import { toPublicEcontCity } from '@/lib/econt/city-search';
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

  const q = String(request.nextUrl.searchParams.get('q') ?? '').slice(0, 80);

  try {
    const cities = await searchEcontCities(q, 40);
    return NextResponse.json({
      success: true,
      cities: cities.map(toPublicEcontCity),
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
