import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Debug: Log service role client creation
console.log('🔧 Creating supabaseAdmin client:', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
  keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
  timestamp: new Date().toISOString()
});

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Debug: Verify client was created successfully
console.log('✅ supabaseAdmin client created, testing connection...');

// Test the connection (this will help debug if service key is working)
supabaseAdmin.from('orders').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('❌ supabaseAdmin connection test failed:', error.message);
      console.error('This means the service role key is not working or RLS policies are missing');
    } else {
      console.log('✅ supabaseAdmin connection test passed, can access orders table');
    }
  });
