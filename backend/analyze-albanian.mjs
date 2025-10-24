import mammoth from 'mammoth';
import fs from 'fs';

async function analyzeAlbanian() {
  console.log('🔍 ANALYZING ALBANIAN QUESTIONNAIRE\n');

  const buffer = fs.readFileSync('../Questionnaire Normal.docx');
  const result = await mammoth.extractRawText({ buffer });
  const htmlResult = await mammoth.convertToHtml({ buffer });

  const lines = result.value.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  console.log('📄 Total lines:', lines.length);
  console.log('\n' + '='.repeat(80));
  console.log('FIRST 100 LINES:');
  console.log('='.repeat(80) + '\n');

  lines.slice(0, 100).forEach((line, idx) => {
    console.log(`${String(idx + 1).padStart(3, ' ')}: ${line}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('ANALYZING PATTERNS:');
  console.log('='.repeat(80) + '\n');

  // Find questions with numbering
  const questionsWithNumbers = lines.filter(l => l.match(/^\d+\./));
  console.log(`Questions with numbers (1., 2., etc.): ${questionsWithNumbers.length}`);
  console.log('Examples:');
  questionsWithNumbers.slice(0, 5).forEach(q => console.log(`  - ${q.substring(0, 80)}...`));

  // Find radio patterns
  console.log('\n\nRadio patterns ( ):');
  const radioLines = lines.filter(l => l.match(/^\(\s*\)/));
  console.log(`Found: ${radioLines.length} lines`);
  radioLines.slice(0, 10).forEach(l => console.log(`  - ${l}`));

  // Find checkbox patterns
  console.log('\n\nCheckbox patterns [ ]:');
  const checkboxLines = lines.filter(l => l.match(/^\[\s*\]/));
  console.log(`Found: ${checkboxLines.length} lines`);
  checkboxLines.slice(0, 10).forEach(l => console.log(`  - ${l}`));

  // Find italic text
  console.log('\n\nItalic text in HTML:');
  const italicMatches = htmlResult.value.match(/<em>([^<]+)<\/em>|<i>([^<]+)<\/i>/gi);
  if (italicMatches) {
    console.log(`Found: ${italicMatches.length} italic sections`);
    italicMatches.slice(0, 10).forEach(m => {
      const text = m.replace(/<\/?(?:em|i)>/gi, '');
      console.log(`  - ${text.substring(0, 80)}...`);
    });
  }

  // Albanian keywords to look for
  console.log('\n\nAlbanian question keywords:');
  const albanianKeywords = ['Cili', 'Cilët', 'Çfarë', 'Ku', 'Kur', 'Pse', 'Si', 'A ka', 'A është', 'Ju lutem', 'Sqaroni', 'Përshkruani'];
  albanianKeywords.forEach(keyword => {
    const count = lines.filter(l => l.includes(keyword)).length;
    if (count > 0) {
      console.log(`  - "${keyword}": ${count} occurrences`);
    }
  });
}

analyzeAlbanian().catch(console.error);
