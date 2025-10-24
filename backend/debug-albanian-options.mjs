import mammoth from 'mammoth';
import fs from 'fs';

async function debugAlbanianOptions() {
  console.log('🔍 DEBUGGING ALBANIAN OPTIONS DETECTION\n');

  const buffer = fs.readFileSync('../Questionnaire Normal.docx');
  const result = await mammoth.extractRawText({ buffer });
  const htmlResult = await mammoth.convertToHtml({ buffer });

  const lines = result.value.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  console.log('Looking at question 1.1 and surrounding lines:\n');
  console.log('='.repeat(80));

  // Find question 1.1
  const q11Index = lines.findIndex(l => l.match(/^1\.1\s+A është/));
  if (q11Index >= 0) {
    console.log(`Found question 1.1 at line ${q11Index}:`);
    console.log(`  ${lines[q11Index]}\n`);

    console.log('Next 20 lines after this question:');
    for (let i = 1; i <= 20 && q11Index + i < lines.length; i++) {
      const line = lines[q11Index + i];

      // Check if line matches any option pattern
      const isRadio = line.match(/^\(\s*\)/);
      const isCheckbox = line.match(/^\[\s*\]/);
      const isBullet = line.match(/^[\*•\-]\s+/);
      const isLetterOption = line.match(/^[a-z]\)\s+/i) || line.match(/^[a-z]\.\s+/i);
      const isNumberOption = line.match(/^\d+\)\s+/);
      const isNextQuestion = line.match(/^\d+\./);
      const isParenthetical = line.match(/^\(.*\)$/);

      let marker = '';
      if (isRadio) marker = ' ← RADIO OPTION';
      if (isCheckbox) marker = ' ← CHECKBOX OPTION';
      if (isBullet) marker = ' ← BULLET OPTION';
      if (isLetterOption) marker = ' ← LETTER OPTION';
      if (isNumberOption) marker = ' ← NUMBER OPTION';
      if (isNextQuestion) marker = ' ← NEXT QUESTION';
      if (isParenthetical) marker = ' ← PARENTHETICAL (instruction)';

      console.log(`  +${i.toString().padStart(2)}: ${line.substring(0, 70)}${marker}`);
    }
  }

  // Look for italic text in HTML
  console.log('\n\n' + '='.repeat(80));
  console.log('ITALIC TEXT in HTML (first 15):');
  console.log('='.repeat(80));

  const italicMatches = htmlResult.value.match(/<em>([^<]+)<\/em>|<i>([^<]+)<\/i>/gi);
  if (italicMatches) {
    console.log(`Total italic sections found: ${italicMatches.length}\n`);
    italicMatches.slice(0, 15).forEach((match, idx) => {
      const text = match.replace(/<\/?(?:em|i)>/gi, '');
      console.log(`${idx + 1}. ${text.substring(0, 75)}...`);
    });
  }

  // Check what happens with "Lini një koment" questions
  console.log('\n\n' + '='.repeat(80));
  console.log('QUESTIONS WITH "Lini një koment" (should be textarea):');
  console.log('='.repeat(80));

  const commentQuestions = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/lini.*koment|ju lutem shkruani|ju lutem.*shkruani/i)) {
      commentQuestions.push({ index: i, line: lines[i] });
    }
  }

  commentQuestions.slice(0, 5).forEach(q => {
    console.log(`\nLine ${q.index}: ${q.line}`);
    console.log('Next 5 lines:');
    for (let j = 1; j <= 5 && q.index + j < lines.length; j++) {
      console.log(`  +${j}: ${lines[q.index + j].substring(0, 70)}`);
    }
  });
}

debugAlbanianOptions().catch(console.error);
