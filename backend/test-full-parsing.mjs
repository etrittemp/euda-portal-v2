// Test full parsing flow with multiple choice questions

const testDocument = `
Anketa (1/12)

3. Përshtatshmëria për punë

3.1 A është i/e durueshëm/e në situata stresante?
( ) Po
( ) Jo

3.2 A ndihet konsideratë ndaj nevojave dhe shqetësimeve të juaja?
( ) Mjaft e kënaqur
( ) Mesatarisht e kënaqur
( ) As e kënaqur as e pakënaqur
( ) Pakënaqur
( ) Shumë pakënaqur

3.3 Si do ta vlerësonit cilësinë e shërbimeve?
( ) E shkëlqyer
( ) Shumë mirë
( ) Mirë
( ) Mesatare
( ) E dobët
( ) Tjetër

3.4 Ju lutem shkruani komentet tuaja

4. Informacioni shtesë

4.1 Çfarë përmirësimesh do të sugjeroni?
( ) Përmirësim i komunikimit
( ) Më shumë burime
( ) Trajnim më i mirë
( ) Tjetër (specifikoni)
`;

console.log('=== Testing Full Document Parsing ===\n');
console.log('Test Document:');
console.log(testDocument);
console.log('\n=== Analysis ===\n');

const lines = testDocument.split('\n').map(l => l.trim()).filter(l => l);

console.log('Total lines:', lines.length);
console.log('\nExpected structure:');
console.log('- Section 1: "Anketa (1/12)" or "Përshtatshmëria për punë"');
console.log('  - Question 3.1: Radio (2 options)');
console.log('  - Question 3.2: Radio (5 options)');
console.log('  - Question 3.3: Radio (6 options, last is "Tjetër" should allow custom input)');
console.log('  - Question 3.4: Textarea');
console.log('- Section 2: "Informacioni shtesë"');
console.log('  - Question 4.1: Radio (4 options, last allows custom input)');
console.log();

// Identify questions and options
let currentLine = 0;
const structure = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Is it a section?
  if (line.match(/^Anketa\s+\(\d+\/\d+\)/i) ||
      line.match(/^\d+\.\s+[A-ZÀÇË]/) && !line.match(/^\d+\.\d+/)) {
    structure.push({ type: 'section', line: i, text: line });
    console.log(`Line ${i}: SECTION - "${line}"`);
  }
  // Is it a question?
  else if (line.match(/^\d+\.\d+/)) {
    structure.push({ type: 'question', line: i, text: line });
    console.log(`Line ${i}: QUESTION - "${line}"`);
  }
  // Is it an option?
  else if (line.match(/^\(\s*\)/)) {
    structure.push({ type: 'option', line: i, text: line });
    console.log(`Line ${i}: OPTION - "${line}"`);
  }
  // Is it a textarea indicator?
  else if (line.match(/ju\s+lutem\s+shkruani|lini.*koment/i)) {
    structure.push({ type: 'textarea', line: i, text: line });
    console.log(`Line ${i}: TEXTAREA INDICATOR - "${line}"`);
  }
  else {
    console.log(`Line ${i}: OTHER - "${line}"`);
  }
}

console.log();

// Analyze structure
const questions = structure.filter(s => s.type === 'question');
const options = structure.filter(s => s.type === 'option');
const sections = structure.filter(s => s.type === 'section');

console.log('=== Statistics ===');
console.log(`Sections found: ${sections.length} (expected: 2)`);
console.log(`Questions found: ${questions.length} (expected: 4)`);
console.log(`Options found: ${options.length} (expected: 17)`);
console.log();

// Check each question's options
console.log('=== Question-Option Mapping ===');
for (let i = 0; i < questions.length; i++) {
  const q = questions[i];
  const nextQ = questions[i + 1];

  const qLine = q.line;
  const endLine = nextQ ? nextQ.line : lines.length;

  const optionsForQ = options.filter(o => o.line > qLine && o.line < endLine);

  console.log(`Question ${i + 1}: "${q.text}"`);
  console.log(`  Options (${optionsForQ.length}):`);
  optionsForQ.forEach(o => {
    const isLast = o === optionsForQ[optionsForQ.length - 1];
    const hasOther = /tjetër|tjeter|other|drugo/i.test(o.text);
    const shouldAllowCustom = isLast && hasOther;
    console.log(`    - "${o.text}"${shouldAllowCustom ? ' [SHOULD ALLOW CUSTOM INPUT]' : ''}`);
  });
  console.log();
}

console.log('=== Validation ===');

// Test 1: All questions detected
const test1Pass = questions.length === 4;
console.log(`Test 1 - All questions detected: ${test1Pass ? '✓ PASS' : '✗ FAIL'} (found ${questions.length}/4)`);

// Test 2: Correct option counts
const q1Options = options.filter(o => o.line > questions[0].line && o.line < questions[1].line).length;
const q2Options = options.filter(o => o.line > questions[1].line && o.line < questions[2].line).length;
const q3Options = options.filter(o => o.line > questions[2].line && o.line < questions[3].line).length;
const q4IsTextarea = questions[3].text.match(/ju\s+lutem\s+shkruani/i);

console.log(`Test 2 - Question 3.1 options: ${q1Options === 2 ? '✓ PASS' : '✗ FAIL'} (found ${q1Options}/2)`);
console.log(`Test 3 - Question 3.2 options: ${q2Options === 5 ? '✓ PASS' : '✗ FAIL'} (found ${q2Options}/5)`);
console.log(`Test 4 - Question 3.3 options: ${q3Options === 6 ? '✓ PASS' : '✗ FAIL'} (found ${q3Options}/6)`);
console.log(`Test 5 - Question 3.4 is textarea: ${q4IsTextarea ? '✓ PASS' : '✗ FAIL'}`);

// Test 3: "Other" options should allow custom input
const q3LastOption = options.filter(o => o.line > questions[2].line && o.line < questions[3].line).pop();
const q3HasOther = q3LastOption && /tjetër|tjeter|other/i.test(q3LastOption.text);
console.log(`Test 6 - Question 3.3 last option has "Tjetër": ${q3HasOther ? '✓ PASS' : '✗ FAIL'}`);

console.log();
console.log('=== Potential Issues ===');

// Check if questions are too close together
for (let i = 0; i < questions.length - 1; i++) {
  const gap = questions[i + 1].line - questions[i].line;
  if (gap < 2) {
    console.log(`⚠️  WARNING: Questions ${i + 1} and ${i + 2} are very close (${gap} lines apart) - options might be missed`);
  }
}

// Check if any options appear after question 3.4 (textarea)
const optionsAfterTextarea = options.filter(o => o.line > questions[3].line);
if (optionsAfterTextarea.length > 0) {
  console.log(`⚠️  WARNING: ${optionsAfterTextarea.length} options found after textarea question - might indicate parsing issue`);
}

console.log();
console.log('Test completed.');
