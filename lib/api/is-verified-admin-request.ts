import 'server-only';

import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth-admin';

/** True when the request carries a valid Supabase Bearer token for a user with profiles.role = admin. */
export async function isVerifiedAdminRequest(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  try {
    await requireAdmin(request);
    return true;
  } catch {
    return false;
  }
}
