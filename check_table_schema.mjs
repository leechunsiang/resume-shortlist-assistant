import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function checkSchema() {
  console.log('🔍 Checking job_listings table schema...\n');

  // Try to query the table to see what columns exist
  const { data, error } = await supabase
    .from('job_listings')
    .select('*')
    .limit(0);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Query successful (checking columns available)');
  }

  // Try selecting with expired_date specifically
  const { data: testData, error: testError } = await supabase
    .from('job_listings')
    .select('id, title, expired_date')
    .limit(1);

  if (testError) {
    console.log('\n❌ expired_date column does NOT exist');
    console.log('Error:', testError.message);
    console.log('\n⚠️  Migration has NOT been applied to the database yet.');
  } else {
    console.log('\n✅ expired_date column EXISTS');
    console.log('Sample data:', testData);
  }
}

checkSchema();
