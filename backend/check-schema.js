import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkSchema() {
  console.log('=== CHECKING DATABASE SCHEMA ===\n');

  // Test 1: Try to select sections column
  console.log('Test 1: Query sections column...');
  const { data: selectData, error: selectError } = await supabase
    .from('questionnaires')
    .select('id, title, sections')
    .limit(1);

  if (selectError) {
    console.error('❌ SELECT with sections column FAILED:');
    console.error('Message:', selectError.message);
    console.error('Code:', selectError.code);
    console.error('Details:', selectError.details);
  } else {
    console.log('✅ SELECT with sections column SUCCESS');
    console.log('Sample data:', selectData);
  }

  // Test 2: Try to insert with sections
  console.log('\nTest 2: Try inserting with sections column...');
  const testData = {
    title: 'Schema Test',
    description: 'Testing sections column',
    status: 'draft',
    sections: [{
      id: 'test-section',
      title: 'Test',
      description: '',
      order_index: 0,
      questions: []
    }],
    created_by: '00000000-0000-0000-0000-000000000000'
  };

  const { data: insertData, error: insertError } = await supabase
    .from('questionnaires')
    .insert([testData])
    .select()
    .single();

  if (insertError) {
    console.error('❌ INSERT with sections column FAILED:');
    console.error('Message:', insertError.message);
    console.error('Code:', insertError.code);
    console.error('Details:', insertError.details);
    console.error('Hint:', insertError.hint);
    console.error('Full error:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('✅ INSERT with sections column SUCCESS');
    console.log('Created ID:', insertData.id);
    console.log('Sections stored correctly?', Array.isArray(insertData.sections));

    // Clean up
    await supabase.from('questionnaires').delete().eq('id', insertData.id);
    console.log('Test questionnaire deleted');
  }

  console.log('\n=== DIAGNOSIS ===');
  if (selectError || insertError) {
    console.log('❌ The sections column is NOT accessible via Supabase API');
    console.log('\nPossible causes:');
    console.log('1. Column was not actually created in the database');
    console.log('2. Schema cache is stale (need to reload)');
    console.log('3. RLS policies are blocking access');
    console.log('\nRECOMMENDED ACTION:');
    console.log('Run the SQL migration manually in Supabase SQL Editor:');
    console.log('ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT \'[]\'::jsonb;');
    console.log('Then reload schema: Dashboard → API → Reload Schema');
  } else {
    console.log('✅ The sections column is working correctly!');
    console.log('The production system should be able to use it.');
  }
}

checkSchema().catch(console.error);
