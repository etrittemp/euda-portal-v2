import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkDatabase() {
  console.log('Checking database for questionnaires...\n');

  // Get all questionnaires
  const { data: questionnaires, error } = await supabase
    .from('questionnaires')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching questionnaires:', error);
    return;
  }

  console.log(`Found ${questionnaires.length} questionnaire(s)\n`);

  questionnaires.forEach((q, index) => {
    console.log(`\n=== Questionnaire ${index + 1} ===`);
    console.log(`ID: ${q.id}`);
    console.log(`Title: ${q.title}`);
    console.log(`Status: ${q.status}`);
    console.log(`Created: ${q.created_at}`);
    console.log(`Updated: ${q.updated_at}`);

    if (q.sections && Array.isArray(q.sections)) {
      console.log(`\nSections (${q.sections.length}):`);
      q.sections.forEach((section, sIndex) => {
        const questionCount = section.questions ? section.questions.length : 0;
        console.log(`  ${sIndex + 1}. ${section.title?.en || 'Untitled'} - ${questionCount} question(s)`);

        if (section.questions && section.questions.length > 0) {
          section.questions.forEach((question, qIndex) => {
            console.log(`     ${qIndex + 1}. ${question.question_text?.en || 'No text'} (${question.question_type})`);
          });
        }
      });
    } else {
      console.log('⚠️  No sections found or sections is not an array!');
      console.log('Raw sections data:', JSON.stringify(q.sections, null, 2));
    }
  });

  // Get the most recently updated questionnaire
  if (questionnaires.length > 0) {
    const latest = questionnaires[0];
    console.log('\n\n=== MOST RECENT QUESTIONNAIRE (Full JSON) ===');
    console.log(JSON.stringify(latest, null, 2));
  }
}

checkDatabase().catch(console.error);
