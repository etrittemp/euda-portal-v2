import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gzzgsyeqpnworczllraa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6emdzeWVxcG53b3JjemxscmFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwMDczMywiZXhwIjoyMDc1NDc2NzMzfQ.EBn8ZlopUc5hQrMO1W5f8JXu-BxMDulkl42dgP6R2_o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Adding password column to questionnaires table...');

    // Run a simple query to add the password column
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS password TEXT NULL;'
    });

    if (error) {
      console.log('⚠️  RPC method not available. Running alternative approach...');

      // Alternative: Check if column exists by trying to select it
      const { data, error: checkError } = await supabase
        .from('questionnaires')
        .select('id, password')
        .limit(1);

      if (checkError && checkError.message.includes('column "password" does not exist')) {
        console.log('❌ Password column does not exist yet.');
        console.log('');
        console.log('📋 Please run this SQL manually in Supabase SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/gzzgsyeqpnworczllraa/sql');
        console.log('');
        console.log('   ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS password TEXT NULL;');
        console.log('');
        return;
      } else if (!checkError) {
        console.log('✅ Password column already exists or was successfully added!');
      } else {
        console.log('⚠️  Unexpected error:', checkError.message);
      }
    } else {
      console.log('✅ Migration completed successfully!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('📋 Please run this SQL manually in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/gzzgsyeqpnworczllraa/sql');
    console.log('');
    console.log('   ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS password TEXT NULL;');
  }
}

runMigration();
