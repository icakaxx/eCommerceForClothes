export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-api-auth';
import { getEcontConfig, isEcontConfigured } from '@/lib/econt/config';

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    if (!isEcontConfigured()) {
      return NextResponse.json({ success: true, configured: false, environment: null });
    }
    const { env, baseUrl } = getEcontConfig();
    return NextResponse.json({ success: true, configured: true, environment: env, baseUrl });
  });
}
