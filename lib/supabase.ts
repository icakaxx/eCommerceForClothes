import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Helper function to validate and get Supabase client
function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = []
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    console.error('❌ Missing Supabase environment variables:', {
      missing: missingVars,
      url: supabaseUrl ? '✅ FOUND' : '❌ MISSING',
      key: supabaseAnonKey ? '✅ FOUND' : '❌ MISSING',
      envFile: 'Check if .env.local exists in root directory',
      instructions: [
        '1. Create .env.local file in the root directory',
        '2. Add: NEXT_PUBLIC_SUPABASE_URL=your_url',
        '3. Add: NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key',
        '4. Restart dev server: npm run dev'
      ]
    });
    
    // Only throw error on client-side (browser), not during SSR
    if (typeof window !== 'undefined') {
      throw new Error(
        `Missing Supabase environment variables: ${missingVars.join(', ')}\n\n` +
        'Please create a .env.local file in the root directory with:\n' +
        'NEXT_PUBLIC_SUPABASE_URL=your_supabase_url\n' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key\n\n' +
        'Then restart the dev server with: npm run dev'
      );
    }
    
    // On server-side, return a placeholder client to prevent SSR errors
    // This will fail gracefully when actually used
    return createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    )
  }

  const client = createClient(supabaseUrl, supabaseAnonKey)

  // Log connection status (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Supabase client connected:', {
      url: supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      storageAvailable: !!client.storage
    })
    
    // Test Storage connection
    if (client.storage) {
      console.log('📦 Supabase Storage is available');
      // List buckets to verify connection
      client.storage.listBuckets().then(({ data, error }) => {
        if (error) {
          console.warn('⚠️ Could not list Storage buckets:', error.message);
        } else {
          console.log('📦 Available Storage buckets:', data?.map(b => ({
            name: b.name,
            public: b.public,
            createdAt: b.created_at
          })) || []);
        }
      }).catch(err => {
        console.warn('⚠️ Storage connection test failed:', err);
      });
    }
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
  
  // Log connection status (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Supabase server client connected:', {
      url: supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    })
  }
  
  return client
}

