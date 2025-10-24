// Quick test for letter suffix pattern detection
const testLines = [
  '1.1.2.a This is a sub-question with letter a',
  '1.1.2.b This is a sub-question with letter b',
  '3.4.1.c Another example with letter c',
  '1.1 Regular hierarchical question',
  '5.2.3 Another regular one',
  'a. Letter only question',
  'Not a question at all'
];

// Test regex patterns
const hierarchicalLetter = /^((\d+\.)+\d+)\.[a-z]\s+.+/i;
const hierarchical = /^(\d+\.)+\d+\s+.+/;

console.log('Testing letter suffix detection:\n');

testLines.forEach(line => {
  const hasLetterSuffix = hierarchicalLetter.test(line);
  const hasHierarchical = hierarchical.test(line);

  let match = null;
  if (hasLetterSuffix) {
    match = line.match(/^((\d+\.)+\d+\.[a-z])\s+/i);
  } else if (hasHierarchical) {
    match = line.match(/^((\d+\.)+\d+)\s+/);
  }

  console.log(`Line: "${line}"`);
  console.log(`  Letter suffix: ${hasLetterSuffix ? '✅' : '❌'}`);
  console.log(`  Hierarchical: ${hasHierarchical ? '✅' : '❌'}`);
  console.log(`  Extracted number: ${match ? match[1] : 'N/A'}`);
  console.log('');
});
