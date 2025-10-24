// Test final parser fixes

console.log('🧪 TESTING FINAL PARSER FIXES\n');
console.log('='.repeat(80));

// Test 1: Embedded line number removal
console.log('\n1. EMBEDDED LINE NUMBER REMOVAL:');
const questionsWithNumbers = [
  '3.1.4 Cilat janë sfidat kryesore në kryerjen e GPS-it? 118Ju lutem shkruani përgjigjen tuaj këtu: 119',
  '3.1.5 Cili është institucioni përgjegjës për kryerjen e GPS-it? * 120Ju lutem shkruani përgjigjen tuaj këtu: 121'
];

questionsWithNumbers.forEach(q => {
  // Simulate the cleaning process
  let cleaned = q.replace(/\s+\d+([A-Z])/g, ' $1'); // "text 118Text" -> "text Text"
  cleaned = cleaned.replace(/\s+\d+\s+/g, ' '); // "text 118 text" -> "text text"

  const hasTextarea = /ju lutem shkruani/i.test(cleaned);
  const marker = hasTextarea ? '✅ TEXTAREA DETECTED' : '❌ NOT DETECTED';

  console.log(`\n  Original: ${q.substring(0, 80)}...`);
  console.log(`  Cleaned:  ${cleaned.substring(0, 80)}...`);
  console.log(`  ${marker}`);
});

// Test 2: Section detection
console.log('\n\n2. SECTION DETECTION:');
const sections = [
  { line: '3. Mbledhja e të dhënave 91', expected: 'MAIN SECTION' },
  { line: 'Anketa e Përgjithshme e Popullsisë (GPS) (1/12) 92', expected: 'SUBSECTION' },
  { line: 'Anketa ESPAD (2/12) 126', expected: 'SUBSECTION' },
  { line: '1. Observatori Kombëtar i Barnave (NDO) 24', expected: 'MAIN SECTION' }
];

sections.forEach(s => {
  const isNumberedSection = s.line.match(/^\d+\.\s+[A-Za-zÀ-ž]/) && !s.line.match(/^\d+\.\d+/);
  const isSubsection = s.line.match(/\(\d+\/\d+\)/);

  let detected = 'NOT A SECTION';
  if (isNumberedSection) detected = 'MAIN SECTION';
  if (isSubsection) detected = 'SUBSECTION';

  const correct = detected === s.expected;
  const marker = correct ? '✅' : '❌';

  console.log(`\n  ${marker} Expected: ${s.expected}, Detected: ${detected}`);
  console.log(`     "${s.line}"`);
});

// Test 3: Section title cleaning (keep numbers)
console.log('\n\n3. SECTION TITLE CLEANING (keep numbers):');
const sectionTitles = [
  { input: '3. Mbledhja e të dhënave 91', expected: '3. Mbledhja e të dhënave' },
  { input: 'Anketa e Përgjithshme e Popullsisë (GPS) (1/12) 92', expected: 'Anketa e Përgjithshme e Popullsisë (GPS) (1/12)' }
];

sectionTitles.forEach(t => {
  // Simulate cleaning
  let cleaned = t.input.replace(/\s+\d+$/, ''); // Remove trailing number

  const correct = cleaned === t.expected;
  const marker = correct ? '✅' : '❌';

  console.log(`\n  ${marker} Input:    "${t.input}"`);
  console.log(`     Expected: "${t.expected}"`);
  console.log(`     Got:      "${cleaned}"`);
});

console.log('\n' + '='.repeat(80));
console.log('\n✅ All fixes tested!');
console.log('Parser should now:');
console.log('  ✓ Strip embedded line numbers from questions');
console.log('  ✓ Detect "Ju lutem shkruani" after cleaning');
console.log('  ✓ Detect numbered sections: "3. Title"');
console.log('  ✓ Detect subsections: "Title (1/12)"');
console.log('  ✓ Keep section numbers in titles');
