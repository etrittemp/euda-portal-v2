import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkSchema() {
  console.log('=== CHECKING DATABASE SCHEMA ===\n');

  // Check questionnaires table structure
  const { data: tables, error: tablesError } = await supabase
    .from('questionnaires')
    .select('*')
    .limit(0);

  if (tablesError) {
    console.error('Error checking schema:', tablesError);
  }

  // Try to get one record to see the structure
  const { data: sample, error: sampleError } = await supabase
    .from('questionnaires')
    .select('*')
    .limit(1);

  console.log('Questionnaires table sample:');
  if (sample && sample.length > 0) {
    console.log('Columns:', Object.keys(sample[0]));
    console.log('\nSample data structure:');
    console.log(JSON.stringify(sample[0], null, 2));
  } else {
    console.log('No data in questionnaires table');
  }

  console.log('\n=== CHECKING RESPONSES TABLE ===\n');

  const { data: responses, error: respError } = await supabase
    .from('questionnaire_responses')
    .select('*')
    .limit(1);

  if (responses && responses.length > 0) {
    console.log('Responses table columns:', Object.keys(responses[0]));
    console.log('\nSample response:');
    console.log(JSON.stringify(responses[0], null, 2));
  } else {
    console.log('No responses in database yet');
  }

  console.log('\n=== TESTING AUTOSAVE ENDPOINT LOGIC ===\n');

  // Test what happens with the autosave structure
  const testData = {
    title: 'Test Questionnaire',
    description: 'Test description',
    sections: [
      {
        id: 'section-123',
        title: { en: 'Section 1', sq: 'Seksioni 1', sr: 'Секција 1' },
        description: { en: '', sq: '', sr: '' },
        order_index: 0,
        questions: [
          {
            id: 'question-456',
            question_text: { en: 'Test question?', sq: 'Pyetje test?', sr: 'Тестно питање?' },
            question_type: 'text',
            options: null,
            required: false,
            order_index: 0,
            validation_rules: {},
            help_text: { en: '', sq: '', sr: '' }
          }
        ]
      }
    ]
  };

  console.log('Test data structure (what autosave will send):');
  console.log(JSON.stringify(testData, null, 2));

  console.log('\n✅ Schema check complete');
}

checkSchema().catch(console.error);
