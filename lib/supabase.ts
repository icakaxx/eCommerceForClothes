import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createSupabaseClient() {
  const client = createClient(supabaseUrl || '', supabaseAnonKey || '')

  if (process.env.NODE_ENV === 'development') {
    logger.debug('Supabase client connected', {
      hasAnonKey: !!supabaseAnonKey,
      storageAvailable: !!client.storage,
    })
  }

  return client
}

// Client-side Supabase client (for browser use)
// Only throws error on client-side, not during SSR
export const supabase = createSupabaseClient()

// Server-side Supabase client (for API routes - bypasses RLS)
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables for server operations')
  }
  
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Supabase server client connected', { hasServiceKey: !!supabaseServiceKey })
  }
  
  return client
}

