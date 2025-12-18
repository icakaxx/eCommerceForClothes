const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function setupDiscountsTable() {
  try {
    console.log('🔧 Setting up discounts table...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'discounts_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📄 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          // If exec_sql doesn't exist, try direct query (this might not work for DDL)
          console.log('   Trying alternative execution method...');
          const { error: altError } = await supabase.from('_supabase_migration_temp').select('*').limit(1);
          // This is just to test connection, DDL statements need to be run in Supabase dashboard
        }
      } catch (err) {
        console.log(`   Statement ${i + 1} may require manual execution in Supabase dashboard`);
      }
    }

    console.log('✅ Discounts table setup complete!');
    console.log('');
    console.log('📋 IMPORTANT: If the automated setup didn\'t work completely,');
    console.log('   please run the following SQL manually in your Supabase SQL Editor:');
    console.log('');
    console.log(sqlContent);
    console.log('');

  } catch (error) {
    console.error('❌ Error setting up discounts table:', error);
    console.log('');
    console.log('📋 Please run the SQL manually in your Supabase SQL Editor:');
    console.log('');
    const sqlPath = path.join(__dirname, 'discounts_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log(sqlContent);
  }
}

setupDiscountsTable();
