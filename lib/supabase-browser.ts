import { createClient } from '@supabase/supabase-js'

// Browser client - ONLY for authentication and safe public reads
// NEVER use for database writes or privileged operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required browser Supabase environment variables')
}

// Create browser client with minimal configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Export type for use in components
export type { User, Session } from '@supabase/supabase-js'








