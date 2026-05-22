'use client';

import { supabase } from '@/lib/supabase-browser';

/** Authorization header for admin-only query params such as includeDisabled=true on GET /api/products. */
export async function adminAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {};
  }

  return { Authorization: `Bearer ${session.access_token}` };
}
