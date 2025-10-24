// Test "Other" option detection with allowsCustomInput flag

const testOptions = [
  '( ) Yes',
  '( ) No',
  '( ) Other (please specify)',
  '[ ] Option A',
  '[ ] Option B',
  '[ ] Other: please describe',
  '( ) Agree',
  '( ) Disagree',
  '( ) Please specify your answer',
  '[ ] Red',
  '[ ] Blue',
  '[ ] Custom color (write in)',
  '( ) Male',
  '( ) Female',
  '( ) Other',
  '( ) Prefer not to say'
];

function detectCustomInput(optionText) {
  // Same logic as in the parser
  const allowsCustomInput = /other|specify|custom|write.?in|fill.?in|please.?state|please.?indicate/i.test(optionText) &&
                            /specify|please|custom|describe|explain|write|fill|state|indicate|:|\(|\[/i.test(optionText);
  return allowsCustomInput;
}

console.log('Testing "Other" option detection:\n');
console.log('='.repeat(80));

testOptions.forEach((option, idx) => {
  const hasCustomInput = detectCustomInput(option);
  const marker = hasCustomInput ? '✅ CUSTOM INPUT' : '❌ Regular option';

  console.log(`${String(idx + 1).padStart(2, ' ')}. ${option.padEnd(40)} ${marker}`);
});

console.log('\n' + '='.repeat(80));
console.log('\nExpected Results:');
console.log('✅ Lines 3, 6, 9, 12, 15 should have custom input enabled');
console.log('❌ All other lines should be regular options');
