// Test that question numbers are preserved in question text
const testCases = [
  { input: '3.2.1 A ka marrë pjesë vendi juaj në anketën ESPAD 2024?', expected: '3.2.1 A ka marrë pjesë vendi juaj në anketën ESPAD 2024?' },
  { input: '1.1.2.a This is a sub-question with letter a', expected: '1.1.2.a This is a sub-question with letter a' },
  { input: '5. What is your name?', expected: '5. What is your name?' },
  { input: '1.1 Regular hierarchical question', expected: '1.1 Regular hierarchical question' }
];

// Simulate the updated extractQuestionNumber function
function extractQuestionNumber(line) {
  const patterns = [
    { regex: /^((\d+\.)+\d+\.[a-z])\s+/i, extract: m => m[1] },
    { regex: /^((\d+\.)+\d+)\s+/, extract: m => m[1] },
    { regex: /^\s*(\d+)\.\s+/, extract: m => m[1] },
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern.regex);
    if (match) {
      const number = pattern.extract(match);
      // KEEP THE NUMBER IN THE TEXT - don't remove it
      const text = line.trim();
      return { number, text, format: 'matched' };
    }
  }

  return { number: null, text: line.trim(), format: 'intelligent' };
}

console.log('Testing question text preservation:\n');

testCases.forEach((testCase, idx) => {
  const result = extractQuestionNumber(testCase.input);
  const passed = result.text === testCase.expected;
  
  console.log(`Test ${idx + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Input:    "${testCase.input}"`);
  console.log(`  Expected: "${testCase.expected}"`);
  console.log(`  Got:      "${result.text}"`);
  console.log(`  Number:   "${result.number}"`);
  console.log('');
});
