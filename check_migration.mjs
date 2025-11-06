import pkg from '@supabase/supabase-js';
const { createClient } = pkg;

const supabaseUrl = 'https://yfljhsgwbclprbsteqox.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmbGpoc2d3YmNscHJic3RlcW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE2MTgyNiwiZXhwIjoyMDc3NzM3ODI2fQ.yoWNxJCBUmZZfDCGiIjDTxRx0KKSfg11q_GvPPYCOpA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Check if expired_date column exists
const { data, error } = await supabase
  .from('job_listings')
  .select('expired_date')
  .limit(1);

if (error) {
  if (error.message.includes('column') && error.message.includes('does not exist')) {
    console.log('❌ expired_date column does NOT exist yet');
    console.log('Migration needs to be applied');
  } else {
    console.log('Error checking:', error);
  }
} else {
  console.log('✅ expired_date column EXISTS');
  console.log('Migration already applied');
}
