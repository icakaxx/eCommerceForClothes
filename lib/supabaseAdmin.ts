import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Create a function to get the admin client instead of creating it at module level
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return createClient(
    supabaseUrl,
    supabaseServiceKey,
    { auth: { persistSession: false } }
  );
}

// Export the admin client for backward compatibility
export const supabaseAdmin = getSupabaseAdmin();

