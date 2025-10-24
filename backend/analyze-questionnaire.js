import mammoth from 'mammoth';
import fs from 'fs';

const filePath = '/home/etritneziri/projects/euda-portal-v2/Questionnaire for Updating_Drafting the EUDA Roadmap-LimeSurvey-final (1).docx';

async function analyzeDocument() {
  try {
    const buffer = fs.readFileSync(filePath);

    // Extract raw text
    const rawResult = await mammoth.extractRawText({ buffer });

    // Extract HTML
    const htmlResult = await mammoth.convertToHtml({ buffer });

    console.log('========================================');
    console.log('DOCUMENT ANALYSIS');
    console.log('========================================\n');

    console.log('Total text length:', rawResult.value.length);
    console.log('');

    // Split into lines
    const lines = rawResult.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    console.log('Total non-empty lines:', lines.length);
    console.log('');

    console.log('FIRST 30 LINES:');
    console.log('----------------------------------------');
    lines.slice(0, 30).forEach((line, idx) => {
      console.log(`${idx + 1}: ${line.substring(0, 100)}`);
    });
    console.log('');

    // Check for numbered questions
    const numberedLines = lines.filter(l => l.match(/^\d+\./));
    console.log('Lines that start with number + period:', numberedLines.length);
    console.log('');

    if (numberedLines.length > 0) {
      console.log('SAMPLE NUMBERED LINES (first 10):');
      console.log('----------------------------------------');
      numberedLines.slice(0, 10).forEach(line => {
        console.log(`- ${line.substring(0, 120)}`);
      });
    }
    console.log('');

    // Check for other patterns
    console.log('PATTERN ANALYSIS:');
    console.log('----------------------------------------');
    console.log('Lines with "Section":', lines.filter(l => /section/i.test(l)).length);
    console.log('Lines with "Part":', lines.filter(l => /^part\s+/i.test(l)).length);
    console.log('Lines with parentheses patterns ():', lines.filter(l => /^\(\s*\)/.test(l)).length);
    console.log('Lines with brackets []:', lines.filter(l => /^\[\s*\]/.test(l)).length);
    console.log('Lines with bullets (*/-/•):', lines.filter(l => /^[\*\-•]\s+/.test(l)).length);

  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeDocument();
