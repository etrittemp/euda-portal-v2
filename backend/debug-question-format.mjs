import mammoth from 'mammoth';
import fs from 'fs';

// Debug script to see what the parser actually sees
const testFile = '../Toy Questionnaire.docx';

async function extractTextFromWord(buffer) {
  const rawResult = await mammoth.extractRawText({ buffer });
  const htmlResult = await mammoth.convertToHtml({ buffer });

  return {
    text: rawResult.value,
    html: htmlResult.value
  };
}

async function debug() {
  console.log('🔍 DEBUGGING QUESTION FORMAT DETECTION\n');

  const buffer = fs.readFileSync(testFile);
  const extractedData = await extractTextFromWord(buffer);

  const lines = extractedData.text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  console.log('📄 Total lines:', lines.length);
  console.log('\n' + '='.repeat(80));
  console.log('FIRST 50 LINES (what the parser sees):');
  console.log('='.repeat(80) + '\n');

  lines.slice(0, 50).forEach((line, idx) => {
    const lineNum = String(idx + 1).padStart(3, ' ');
    console.log(`${lineNum}: ${line}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('CHECKING QUESTION DETECTION:');
  console.log('='.repeat(80) + '\n');

  // Find question 1
  const q1Index = lines.findIndex(l => l.match(/^1\.\s+Which age group/));
  if (q1Index >= 0) {
    console.log(`Found Question 1 at line ${q1Index + 1}: ${lines[q1Index]}`);
    console.log('\nNext 15 lines after question:');
    for (let i = 1; i <= 15 && q1Index + i < lines.length; i++) {
      const line = lines[q1Index + i];
      const hasParens = line.match(/^\(\s*\)/);
      const hasBrackets = line.match(/^\[\s*\]/);
      const marker = hasParens ? ' ← RADIO!' : hasBrackets ? ' ← CHECKBOX!' : '';
      console.log(`  +${i}: ${line}${marker}`);
    }
  }

  // Find question 8 (checkbox example)
  const q8Index = lines.findIndex(l => l.match(/^8\.\s+Do you sort/));
  if (q8Index >= 0) {
    console.log(`\n\nFound Question 8 at line ${q8Index + 1}: ${lines[q8Index]}`);
    console.log('\nNext 10 lines after question:');
    for (let i = 1; i <= 10 && q8Index + i < lines.length; i++) {
      const line = lines[q8Index + i];
      const hasParens = line.match(/^\(\s*\)/);
      const hasBrackets = line.match(/^\[\s*\]/);
      const marker = hasParens ? ' ← RADIO!' : hasBrackets ? ' ← CHECKBOX!' : '';
      console.log(`  +${i}: ${line}${marker}`);
    }
  }
}

debug().catch(console.error);
