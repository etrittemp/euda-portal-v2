import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function runMigration() {
  try {
    console.log('Running migration to add sections column...\n');

    const migrationSQL = `
ALTER TABLE questionnaires
ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb;
`;

    console.log('SQL to execute:');
    console.log(migrationSQL);
    console.log('\n⚠️  Note: Supabase JS client cannot execute ALTER TABLE directly.');
    console.log('\n📋 Please run this SQL manually in Supabase Dashboard:');
    console.log('1. Go to: https://supabase.com/dashboard → Your Project → SQL Editor');
    console.log('2. Paste the SQL above');
    console.log('3. Click RUN');
    console.log('\nOr run via psql if you have direct database access.\n');

  } catch (err) {
    console.error('Error:', err);
  }
}

runMigration();
