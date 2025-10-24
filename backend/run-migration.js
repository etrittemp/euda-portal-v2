import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: '.env.vercel' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Running migration: add_password_to_questionnaires.sql');

    // Read the migration file
    const migrationPath = join(__dirname, 'migrations', 'add_password_to_questionnaires.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If RPC doesn't exist, we'll need to run it manually
      console.log('⚠️  Cannot run migration automatically via RPC.');
      console.log('📋 Please run this SQL manually in Supabase SQL Editor:');
      console.log('');
      console.log(migrationSQL);
      console.log('');
      console.log('Or visit: https://supabase.com/dashboard/project/[your-project]/sql');
      return;
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.log('');
    console.log('📋 Please run this SQL manually in Supabase SQL Editor:');
    console.log('');
    const migrationPath = join(__dirname, 'migrations', 'add_password_to_questionnaires.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(migrationSQL);
    console.log('');
    console.log('Visit: https://supabase.com/dashboard/project/gzzgsyeqpnworczllraa/sql');
  }
}

runMigration();
