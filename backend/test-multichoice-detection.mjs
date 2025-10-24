import mammoth from 'mammoth';
import fs from 'fs/promises';

// Simulate the full parsing flow to test multiple choice detection

function cleanEmbeddedLineNumbers(text) {
  if (!text) return text;
  let cleaned = text.replace(/\s+(\d{2,4})([A-ZÀČÇĐËĚÉÌÍŁŃÒÓŘŠŚŤÙÚÝŽАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ])/g, ' $2');
  cleaned = cleaned.replace(/\s+\d{2,4}\s+/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

function extractLinguisticFeatures(text) {
  return {
    hasAll: /all|everything|select all/i.test(text),
    hasOne: /one|single|tylko/i.test(text),
    hasSelect: /select|choose|pick/i.test(text)
  };
}

function analyzeContext(lines, startIdx, windowSize) {
  const window = lines.slice(startIdx, startIdx + windowSize);
  const hasOptionsAfter = window.some(l => l.match(/^\(\s*\)|^\[\s*\]|^[a-z]\)|^\d+\)/));
  const hasScaleAfter = window.some(l => l.match(/[\(\[]\s*[\)\]]\s*\d+\s+[\(\[]\s*[\)\]]\s*\d+/));
  const optionCount = window.filter(l => l.match(/^\(\s*\)|^\[\s*\]/)).length;

  return { hasOptionsAfter, hasScaleAfter, optionCount };
}

function classifyQuestionType(questionText, nextLines) {
  const cleanedText = cleanEmbeddedLineNumbers(questionText);
  const cleanedNextLines = nextLines.map(l => cleanEmbeddedLineNumbers(l));

  const features = extractLinguisticFeatures(cleanedText);
  const context = analyzeContext([cleanedText, ...cleanedNextLines], 0, 10);

  const scores = {
    radio: 0,
    checkbox: 0,
    textarea: 0,
    text: 0,
    rating: 0
  };

  // STRONG TEXTAREA OVERRIDE
  const textareaKeywords = /lini.*koment|ju\s+lutem\s+shkruani|ju\s+lutem.*shkruani|përgjigjen\s+tuaj|pergjigjen\s+tuaj|napišite|napisite|molimo.*napišite|ostavite.*komentar|please\s+write|write\s+your\s+answer|write.*here|leave.*comment/i;

  if (textareaKeywords.test(cleanedText)) {
    return { type: 'textarea', confidence: 0.99 };
  }

  const nextFewLines = cleanedNextLines.slice(0, 3).join(' ');
  if (textareaKeywords.test(nextFewLines)) {
    return { type: 'textarea', confidence: 0.98 };
  }

  // CHECKBOX DETECTION
  if (features.hasAll) {
    scores.checkbox += 90;
  }
  if (/select all|check all|zgjidhni të gjitha/i.test(cleanedText)) {
    scores.checkbox += 80;
  }

  const hasBrackets = nextLines.some(l => l.match(/^\[\s*\]/));
  if (hasBrackets) {
    scores.checkbox += 100;
    scores.radio = Math.max(0, scores.radio - 50);
  }

  // RADIO DETECTION
  if (features.hasOne && features.hasSelect) {
    scores.radio += 70;
  }
  if (/select one|choose one|zgjidhni vetëm një/i.test(cleanedText)) {
    scores.radio += 80;
  }

  const hasParentheses = nextLines.some(l => l.match(/^\(\s*\)\s+[A-Za-zА-Я]/));
  if (hasParentheses) {
    scores.radio += 100;
    scores.checkbox = Math.max(0, scores.checkbox - 50);
  }

  // BINARY (Yes/No)
  const yesNoCount = nextLines.filter(l => /^[\(\[]?\s*[\)\]]?\s*(po|jo|yes|no|да|ne)$/i.test(l.trim())).length;
  if (yesNoCount === 2) {
    scores.radio += 100;
  }

  // LIKERT/RATING
  if (/rate|satisfied|agree|kënaqur|zadovoljan/i.test(cleanedText)) {
    scores.rating += 60;
    scores.radio += 40;
  }

  // Find highest score
  let maxScore = 0;
  let detectedType = 'text';
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedType = type;
    }
  }

  return { type: detectedType, confidence: maxScore / 100, scores };
}

// Test cases
console.log('=== Testing Multiple Choice Detection ===\n');

// Test 1: Simple radio question
console.log('Test 1: Simple Yes/No radio question');
const test1Question = '3.1 A është i/e durueshëm/e në situata stresante?';
const test1NextLines = ['( ) Po', '( ) Jo', '', '3.2 Next question'];
const test1Result = classifyQuestionType(test1Question, test1NextLines);
console.log('Question:', test1Question);
console.log('Detected type:', test1Result.type);
console.log('Confidence:', test1Result.confidence);
console.log('Expected: radio');
console.log('Result:', test1Result.type === 'radio' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 2: Likert scale question
console.log('Test 2: Satisfaction/rating question with options');
const test2Question = '3.2 A ndihet konsideratë ndaj nevojave dhe shqetësimeve të juaja?';
const test2NextLines = [
  '( ) Mjaft e kënaqur',
  '( ) Mesatarisht e kënaqur',
  '( ) As e kënaqur as e pakënaqur',
  '( ) Pakënaqur',
  '( ) Shumë pakënaqur',
  '',
  '3.3 Next question'
];
const test2Result = classifyQuestionType(test2Question, test2NextLines);
console.log('Question:', test2Question);
console.log('Detected type:', test2Result.type);
console.log('Confidence:', test2Result.confidence);
console.log('Scores:', test2Result.scores);
console.log('Expected: radio or rating');
console.log('Result:', (test2Result.type === 'radio' || test2Result.type === 'rating') ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 3: Checkbox (select all that apply)
console.log('Test 3: Checkbox - select all that apply');
const test3Question = 'Zgjidhni të gjitha që ju përshtaten';
const test3NextLines = [
  '[ ] Option 1',
  '[ ] Option 2',
  '[ ] Option 3',
  '',
  '4.1 Next question'
];
const test3Result = classifyQuestionType(test3Question, test3NextLines);
console.log('Question:', test3Question);
console.log('Detected type:', test3Result.type);
console.log('Confidence:', test3Result.confidence);
console.log('Expected: checkbox');
console.log('Result:', test3Result.type === 'checkbox' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 4: Question followed immediately by another question (edge case)
console.log('Test 4: Sequential questions without separator');
const test4Question = '5.1 First question?';
const test4NextLines = [
  '( ) Yes',
  '( ) No',
  '5.2 Second question immediately after?',
  '( ) Option A',
  '( ) Option B'
];
const test4Result = classifyQuestionType(test4Question, test4NextLines);
console.log('Question:', test4Question);
console.log('Detected type:', test4Result.type);
console.log('Confidence:', test4Result.confidence);
console.log('Expected: radio');
console.log('Result:', test4Result.type === 'radio' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 5: Question with "Other" option
console.log('Test 5: Radio question with "Other" option');
const test5Question = '6.1 What is your preference?';
const test5NextLines = [
  '( ) Option A',
  '( ) Option B',
  '( ) Tjetër (specifikoni)',
  '',
  '6.2 Next question'
];
const test5Result = classifyQuestionType(test5Question, test5NextLines);
console.log('Question:', test5Question);
console.log('Detected type:', test5Result.type);
console.log('Confidence:', test5Result.confidence);
console.log('Expected: radio');
console.log('Result:', test5Result.type === 'radio' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 6: Textarea question (should NOT be detected as radio)
console.log('Test 6: Textarea question should not be radio');
const test6Question = '7.1 Ju lutem shkruani përgjigjen tuaj';
const test6NextLines = ['', '7.2 Next question'];
const test6Result = classifyQuestionType(test6Question, test6NextLines);
console.log('Question:', test6Question);
console.log('Detected type:', test6Result.type);
console.log('Confidence:', test6Result.confidence);
console.log('Expected: textarea');
console.log('Result:', test6Result.type === 'textarea' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 7: Question with plain text options (Albanian pattern)
console.log('Test 7: Plain text Yes/No options (no markers)');
const test7Question = '8.1 A jeni të kënaqur?';
const test7NextLines = ['Po', 'Jo', '', '8.2 Next question'];
const test7Result = classifyQuestionType(test7Question, test7NextLines);
console.log('Question:', test7Question);
console.log('Detected type:', test7Result.type);
console.log('Confidence:', test7Result.confidence);
console.log('Scores:', test7Result.scores);
console.log('Expected: radio (plain text yes/no should be detected)');
console.log('Result:', test7Result.type === 'radio' ? '✓ PASS' : '✗ FAIL');
console.log();

console.log('\n=== Summary ===');
console.log('All tests completed. Review results above.');
