// Test that boolean questions extract actual options from the document

console.log('=== Testing Boolean Option Extraction ===\n');

// Simulate extractOptions function
function extractOptions(lines, startIndex, questionType) {
  const options = [];
  const processedLines = new Set();
  let i = startIndex;

  // Skip instructional lines
  while (i < lines.length && lines[i].match(/^\(.*\)$/)) {
    processedLines.add(i);
    i++;
  }

  while (i < lines.length) {
    if (processedLines.has(i)) {
      i++;
      continue;
    }

    const line = lines[i].trim();

    // Stop conditions
    if (!line) break;
    if (line.match(/^\d+\.\d+/)) break;

    // Patterns
    const patterns = [
      { regex: /^\(\s*\)\s+(.+)/, type: 'radio_empty' },
      { regex: /^\[\s*\]\s+(.+)/, type: 'checkbox_empty' },
      { regex: /^\*\s+(.+)/, type: 'bullet_star' },
      { regex: /^•\s+(.+)/, type: 'bullet_dot' },
      { regex: /^●\s+(.+)/, type: 'bullet_filled' },
      { regex: /^-\s+(.+)/, type: 'bullet_dash' }
    ];

    let matched = false;
    for (const pattern of patterns) {
      const match = line.match(pattern.regex);
      if (match) {
        const optionText = match[1].trim();

        options.push({
          value: optionText.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
          label: { en: optionText, sq: optionText, sr: optionText }
        });

        processedLines.add(i);
        matched = true;
        break;
      }
    }

    if (matched) {
      i++;
      continue;
    }

    // Plain text options for boolean
    if (questionType === 'boolean' && options.length < 2) {
      const isYesNo = /^(po|jo|yes|no|да|ne|не)$/i.test(line);
      if (isYesNo) {
        options.push({
          value: line.toLowerCase(),
          label: { en: line, sq: line, sr: line }
        });
        processedLines.add(i);
        i++;
        continue;
      }
    }

    // If we have options and this doesn't match, stop
    if (options.length > 0) break;

    i++;
  }

  return options;
}

// Test 1: Albanian Po/Jo with ( ) markers
console.log('Test 1: Extract "( ) Po" and "( ) Jo"');
const test1Lines = ['', '( ) Po', '( ) Jo', '', '2.1 Next question'];
const test1Options = extractOptions(test1Lines, 1, 'boolean');
console.log('Options extracted:', test1Options.length);
test1Options.forEach((opt, i) => {
  console.log(`  Option ${i + 1}: "${opt.label.en}"`);
});
console.log('Expected: 2 options with labels "Po" and "Jo"');
console.log('Result:', test1Options.length === 2 && test1Options[0].label.en === 'Po' && test1Options[1].label.en === 'Jo' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 2: Plain text Po/Jo (no markers)
console.log('Test 2: Extract plain "Po" and "Jo" (no markers)');
const test2Lines = ['', 'Po', 'Jo', '', '2.2 Next question'];
const test2Options = extractOptions(test2Lines, 1, 'boolean');
console.log('Options extracted:', test2Options.length);
test2Options.forEach((opt, i) => {
  console.log(`  Option ${i + 1}: "${opt.label.en}"`);
});
console.log('Expected: 2 options with labels "Po" and "Jo"');
console.log('Result:', test2Options.length === 2 && test2Options[0].label.en === 'Po' && test2Options[1].label.en === 'Jo' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 3: Bullet points ● with Po/Jo
console.log('Test 3: Extract "●    Po" and "●    Jo"');
const test3Lines = ['', '●    Po', '●    Jo', '', '3.1 Next question'];
const test3Options = extractOptions(test3Lines, 1, 'boolean');
console.log('Options extracted:', test3Options.length);
test3Options.forEach((opt, i) => {
  console.log(`  Option ${i + 1}: "${opt.label.en}"`);
});
console.log('Expected: 2 options with labels "Po" and "Jo"');
console.log('Result:', test3Options.length === 2 && test3Options[0].label.en === 'Po' && test3Options[1].label.en === 'Jo' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 4: English Yes/No
console.log('Test 4: Extract "( ) Yes" and "( ) No"');
const test4Lines = ['', '( ) Yes', '( ) No', '', '4.1 Next question'];
const test4Options = extractOptions(test4Lines, 1, 'boolean');
console.log('Options extracted:', test4Options.length);
test4Options.forEach((opt, i) => {
  console.log(`  Option ${i + 1}: "${opt.label.en}"`);
});
console.log('Expected: 2 options with labels "Yes" and "No"');
console.log('Result:', test4Options.length === 2 && test4Options[0].label.en === 'Yes' && test4Options[1].label.en === 'No' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 5: Serbian Да/Не
console.log('Test 5: Extract "( ) Да" and "( ) Не"');
const test5Lines = ['', '( ) Да', '( ) Не', '', '5.1 Next question'];
const test5Options = extractOptions(test5Lines, 1, 'boolean');
console.log('Options extracted:', test5Options.length);
test5Options.forEach((opt, i) => {
  console.log(`  Option ${i + 1}: "${opt.label.en}"`);
});
console.log('Expected: 2 options with labels "Да" and "Не"');
console.log('Result:', test5Options.length === 2 && test5Options[0].label.en === 'Да' && test5Options[1].label.en === 'Не' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 6: Long options that START with Po/Jo (user's real example)
console.log('Test 6: Extract full options that start with Po/Jo');
const test6Lines = [
  '',
  '●    Po, NDO është themeluar zyrtarisht në bazë ligjore dhe ka qenë funksionale. 27',
  '●    Jo, NDO nuk është themeluar ende zyrtarisht. 29',
  '',
  '1.2 Next question'
];
const test6Options = extractOptions(test6Lines, 1, 'boolean');
console.log('Options extracted:', test6Options.length);
test6Options.forEach((opt, i) => {
  console.log(`  Option ${i + 1}: "${opt.label.en.substring(0, 50)}..."`);
});
console.log('Expected: 2 options with full text extracted');
console.log('Result:', test6Options.length === 2 ? '✓ PASS' : '✗ FAIL');
console.log();

console.log('=== Summary ===');
const tests = [
  test1Options.length === 2 && test1Options[0].label.en === 'Po',
  test2Options.length === 2 && test2Options[0].label.en === 'Po',
  test3Options.length === 2 && test3Options[0].label.en === 'Po',
  test4Options.length === 2 && test4Options[0].label.en === 'Yes',
  test5Options.length === 2 && test5Options[0].label.en === 'Да',
  test6Options.length === 2
];
const passed = tests.filter(t => t).length;
console.log(`${passed}/${tests.length} tests passed`);
console.log(passed === tests.length ? '\n✓ All tests PASSED!' : '\n✗ Some tests FAILED');
