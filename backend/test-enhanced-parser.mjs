import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

// Test the enhanced parser with all three questionnaires
const testFiles = [
  '../Questionnaire Normal.docx',
  '../Toy Questionnaire.docx',
  '../Questionnaire for Updating_Drafting the EUDA Roadmap-LimeSurvey-final (1).docx'
];

console.log('🧪 TESTING ENHANCED PARSER v2.0 (2025 Algorithm)');
console.log('='.repeat(60));

async function extractTextFromWord(buffer) {
  const rawResult = await mammoth.extractRawText({ buffer });
  const htmlResult = await mammoth.convertToHtml({ buffer });

  const metadata = {
    hasBold: /<strong>|<b>/i.test(htmlResult.value),
    hasItalic: /<em>|<i>/i.test(htmlResult.value),
    hasUnderline: /<u>/i.test(htmlResult.value),
    hasList: /<ul>|<ol>/i.test(htmlResult.value),
    hasTable: /<table>/i.test(htmlResult.value)
  };

  return {
    text: rawResult.value,
    html: htmlResult.value,
    metadata
  };
}

async function testParser(filePath) {
  console.log(`\n📄 Testing: ${path.basename(filePath)}`);
  console.log('-'.repeat(60));

  try {
    const buffer = fs.readFileSync(filePath);
    const extractedData = await extractTextFromWord(buffer);

    // Dynamically import the parser from file-upload.js
    const fileUploadModule = await import('./routes/file-upload.js');
    const parseTextToQuestionnaire = fileUploadModule.parseTextToQuestionnaire;

    const result = parseTextToQuestionnaire(extractedData);
    const { sections, metadata } = result;

    console.log(`✅ Sections: ${sections.length}`);
    console.log(`✅ Total Questions: ${metadata.totalQuestions}`);

    // Analyze question types
    const typeCount = {};
    let totalOptions = 0;
    let radioCount = 0;
    let checkboxCount = 0;

    sections.forEach((section, idx) => {
      console.log(`\n   Section ${idx + 1}: "${section.title.en}"`);
      console.log(`   └─ Questions: ${section.questions.length}`);

      section.questions.forEach(q => {
        typeCount[q.question_type] = (typeCount[q.question_type] || 0) + 1;

        if (q.options && q.options.length > 0) {
          totalOptions += q.options.length;
          if (q.question_type === 'radio') radioCount++;
          if (q.question_type === 'checkbox') checkboxCount++;
        }
      });
    });

    console.log(`\n📊 Question Type Distribution:`);
    Object.entries(typeCount).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    console.log(`\n🎯 Option Detection:`);
    console.log(`   Total options detected: ${totalOptions}`);
    console.log(`   Radio questions: ${radioCount}`);
    console.log(`   Checkbox questions: ${checkboxCount}`);

    // Database compatibility check
    const validTypes = ['text', 'textarea', 'radio', 'checkbox', 'select', 'number', 'email', 'phone', 'url', 'date', 'time', 'rating', 'slider', 'file'];
    const invalidTypes = Object.keys(typeCount).filter(t => !validTypes.includes(t));

    if (invalidTypes.length > 0) {
      console.log(`\n❌ INVALID TYPES (not database compatible):`);
      invalidTypes.forEach(type => console.log(`   - ${type}`));
    } else {
      console.log(`\n✅ ALL TYPES DATABASE COMPATIBLE`);
    }

    return {
      filename: path.basename(filePath),
      sections: sections.length,
      questions: metadata.totalQuestions,
      options: totalOptions,
      types: typeCount,
      valid: invalidTypes.length === 0
    };

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
    return null;
  }
}

async function runAllTests() {
  const results = [];

  for (const file of testFiles) {
    const result = await testParser(file);
    if (result) results.push(result);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 SUMMARY');
  console.log('='.repeat(60));

  const totalQuestions = results.reduce((sum, r) => sum + r.questions, 0);
  const totalSections = results.reduce((sum, r) => sum + r.sections, 0);
  const totalOptions = results.reduce((sum, r) => sum + r.options, 0);
  const allValid = results.every(r => r.valid);

  console.log(`\n✅ Questionnaires tested: ${results.length}/${testFiles.length}`);
  console.log(`✅ Total sections: ${totalSections}`);
  console.log(`✅ Total questions: ${totalQuestions}`);
  console.log(`✅ Total options: ${totalOptions}`);
  console.log(`${allValid ? '✅' : '❌'} Database compatibility: ${allValid ? 'PASS' : 'FAIL'}`);

  console.log('\n🎉 ENHANCED PARSER TEST COMPLETE!\n');
}

runAllTests().catch(console.error);
