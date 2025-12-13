import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Server client - ONLY for server-side operations
// Uses service role key for full database access
// NEVER expose to client-side code
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required server Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Singleton instance for reuse within the same request
let serverClient: ReturnType<typeof createClient> | null = null
