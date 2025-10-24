// Test italic text extraction from HTML context

function extractHelpText(htmlContext) {
  if (!htmlContext) return '';

  const italicMatches = htmlContext.match(/<em>([^<]+)<\/em>|<i>([^<]+)<\/i>/gi);
  if (italicMatches && italicMatches.length > 0) {
    const lastItalic = italicMatches[italicMatches.length - 1];
    return lastItalic.replace(/<\/?(?:em|i)>/gi, '').trim();
  }

  return '';
}

const testCases = [
  {
    name: 'Single <em> tag',
    html: '<p>Question text here</p><p><em>This is help text</em></p>',
    expected: 'This is help text'
  },
  {
    name: 'Single <i> tag',
    html: '<p>Question text here</p><p><i>This is italic help</i></p>',
    expected: 'This is italic help'
  },
  {
    name: 'Multiple italic tags (should use last)',
    html: '<p><em>First italic</em></p><p>Regular text</p><p><em>Last italic</em></p>',
    expected: 'Last italic'
  },
  {
    name: 'No italic tags',
    html: '<p>Just regular text</p>',
    expected: ''
  },
  {
    name: 'Mixed <em> and <i>',
    html: '<p><em>First</em></p><p><i>Second</i></p>',
    expected: 'Second'
  }
];

console.log('Testing italic text extraction:\n');

testCases.forEach((testCase, idx) => {
  const result = extractHelpText(testCase.html);
  const passed = result === testCase.expected;

  console.log(`Test ${idx + 1} (${testCase.name}): ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Expected: "${testCase.expected}"`);
  console.log(`  Got:      "${result}"`);
  console.log('');
});
