// Debug script to test order creation
// Run with: node debug-orders.js

const { createClient } = require('@supabase/supabase-js');

// Test environment variables
console.log('🔍 Environment Variables Check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

// Test service role client creation
console.log('\n🔧 Testing Supabase Client Creation:');
try {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
  console.log('✅ Supabase admin client created successfully');
} catch (error) {
  console.log('❌ Failed to create supabase admin client:', error.message);
}

// Test a simple query to verify permissions
async function testPermissions() {
  console.log('\n🧪 Testing Database Permissions:');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Cannot test - missing environment variables');
    return;
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Test SELECT permission
    console.log('Testing SELECT permission...');
    const { data: selectData, error: selectError } = await supabaseAdmin
      .from('orders')
      .select('orderid')
      .limit(1);

    if (selectError) {
      console.log('❌ SELECT failed:', selectError.message);
    } else {
      console.log('✅ SELECT works, found', selectData?.length || 0, 'records');
    }

    // Test INSERT permission (this is what fails in your API)
    console.log('Testing INSERT permission...');
    const testOrderId = `DEBUG-${Date.now()}`;
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert({
        orderid: testOrderId,
        customerfirstname: 'Debug',
        customerlastname: 'Test',
        customeremail: 'debug@example.com',
        customertelephone: '+123456789',
        customercountry: 'Test',
        customercity: 'Test',
        deliverytype: 'office',
        subtotal: 10.00,
        deliverycost: 5.00,
        total: 15.00,
        status: 'pending',
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      })
      .select();

    if (insertError) {
      console.log('❌ INSERT failed:', insertError.message);
      console.log('This is the same error you see in your API!');
    } else {
      console.log('✅ INSERT works, created order:', insertData?.[0]?.orderid);

      // Clean up the test record
      await supabaseAdmin.from('orders').delete().eq('orderid', testOrderId);
      console.log('🧹 Cleaned up test record');
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testPermissions();
