import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the file-upload.js and extract the classifyQuestionType function
const fileContent = readFileSync(join(__dirname, 'routes', 'file-upload.js'), 'utf-8');

// Test the specific example from the user
const questionText = "1.2.2 Nëse OND-ja është themeluar zyrtarisht, a ka një buxhet vjetor të ndarë posaçërisht për detyrat dhe aktivitetet e OND-së? 41";
const nextLines = [
  "●    Po 42",
  "●    Jo 43"
];

console.log('\n=== Testing Long Boolean Question ===');
console.log('Question:', questionText);
console.log('Next Lines:', nextLines);
console.log('\nTesting patterns:');

// Test the yes/no pattern directly
const yesNoPatterns = /^[\(\[\*\-•●]?\s*[\)\]]?\s*(yes|no|po|jo|да|ne|не)\b/i;
const matches = nextLines.filter(l => yesNoPatterns.test(l.trim()));

console.log('\nPattern:', yesNoPatterns.toString());
console.log('Matches:', matches);
console.log('Match count:', matches.length);

// Test each line individually
nextLines.forEach((line, i) => {
  const trimmed = line.trim();
  const matches = yesNoPatterns.test(trimmed);
  console.log(`\nLine ${i + 1}: "${trimmed}"`);
  console.log(`  Matches: ${matches}`);
  if (matches) {
    const match = trimmed.match(yesNoPatterns);
    console.log(`  Captured word: "${match[1]}"`);
  }
});

console.log('\n✓ If match count is 2, the question should be classified as boolean');
