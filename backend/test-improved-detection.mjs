// Test improved textarea vs multiple choice detection

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
    hasSelect: /select|choose|pick/i.test(text),
    hasDescribe: /describe|explain|elaborate/i.test(text),
    hasOpinion: /opinion|think|believe/i.test(text),
    hasFeedback: /feedback|comment|suggestion/i.test(text),
    hasWhy: /why/i.test(text),
    wordCount: text.split(/\s+/).length,
    hasLongAnswer: /long answer|paragraph|essay/i.test(text)
  };
}

function analyzeContext(lines, startIdx, windowSize) {
  const window = lines.slice(startIdx, startIdx + windowSize);
  const hasOptionsAfter = window.some(l => l.match(/^[\(\[\*\-•]\s*[\)\]]?\s*.+/));
  const hasScaleAfter = window.some(l => l.match(/[\(\[]\s*[\)\]]\s*\d+\s+[\(\[]\s*[\)\]]\s*\d+/));
  const optionCount = window.filter(l => l.match(/^[\(\[\*\-•]\s*[\)\]]?\s*.+/)).length;
  const hasBlankAfter = window.some(l => l.match(/_{3,}|\[.*\]/));

  return { hasOptionsAfter, hasScaleAfter, optionCount, hasBlankAfter };
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
    return { type: 'textarea', confidence: 0.99, scores };
  }

  const nextFewLines = cleanedNextLines.slice(0, 3).join(' ');
  if (textareaKeywords.test(nextFewLines)) {
    return { type: 'textarea', confidence: 0.98, scores };
  }

  // CHECKBOX DETECTION
  if (features.hasAll) {
    scores.checkbox += 90;
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

  // TEXTAREA DETECTION
  if (features.hasDescribe) {
    scores.textarea += 70;
  }
  if (features.hasOpinion || features.hasFeedback) {
    scores.textarea += 60;
  }
  if (features.hasWhy) {
    scores.textarea += 50;
  }
  if (/explain|elaborate|detail|discuss|comment|feedback|thoughts|describe|shpjegoni|sqaroni|përshkruani|diskutoni|koment|opišite|objasnite|komentar/i.test(cleanedText)) {
    scores.textarea += 70;
  }
  if (/please provide|tell us about|share your|in your own words|ju lutem|shkruani|napišite|molimo/i.test(cleanedText)) {
    scores.textarea += 65;
  }
  if (features.hasLongAnswer) {
    scores.textarea += 60;
  }
  if (context.hasBlankAfter && !context.hasOptionsAfter) {
    scores.textarea += 40;
  }
  if (features.wordCount > 20) {
    scores.textarea += 30;
  }

  // CONTEXT-BASED ADJUSTMENTS - NEW IMPROVED LOGIC
  if (context.hasOptionsAfter) {
    // Aggressively reduce non-selection types when options are present
    scores.text = Math.max(0, scores.text - 100);
    scores.textarea = Math.max(0, scores.textarea - 150); // Strong reduction for textarea
    scores.number = Math.max(0, scores.number - 80);
    scores.date = Math.max(0, scores.date - 80);

    // Boost selection types significantly when options are detected
    if (scores.radio > 0) scores.radio += 50;
    if (scores.checkbox > 0) scores.checkbox += 50;

    // If we have many options (3+), it's definitely a selection type
    if (context.optionCount >= 3) {
      scores.textarea = 0; // Zero out textarea completely
      scores.text = 0; // Zero out text completely
      if (scores.radio > 0) scores.radio += 30;
      if (scores.checkbox > 0) scores.checkbox += 30;
    }
  }

  // If no options, deprioritize selection types
  if (!context.hasOptionsAfter && !context.hasScaleAfter) {
    scores.radio = Math.max(0, scores.radio - 40);
    scores.checkbox = Math.max(0, scores.checkbox - 40);
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

console.log('=== Testing Improved Textarea vs Multiple Choice Detection ===\n');

// Test 1: Question with "describe" keyword BUT has options - should be RADIO, not textarea
console.log('Test 1: "Describe" keyword WITH options should be radio');
const test1Question = 'Please describe your satisfaction level';
const test1NextLines = ['( ) Very satisfied', '( ) Satisfied', '( ) Neutral', '( ) Unsatisfied', '( ) Very unsatisfied'];
const test1Result = classifyQuestionType(test1Question, test1NextLines);
console.log('Question:', test1Question);
console.log('Options:', test1NextLines.length);
console.log('Detected type:', test1Result.type);
console.log('Scores:', test1Result.scores);
console.log('Expected: radio (options present should override "describe" keyword)');
console.log('Result:', test1Result.type === 'radio' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 2: Question with "explain" keyword BUT has options - should be RADIO
console.log('Test 2: "Explain" keyword WITH options should be radio');
const test2Question = 'How would you explain your experience?';
const test2NextLines = ['( ) Excellent', '( ) Good', '( ) Average', '( ) Poor'];
const test2Result = classifyQuestionType(test2Question, test2NextLines);
console.log('Question:', test2Question);
console.log('Options:', test2NextLines.length);
console.log('Detected type:', test2Result.type);
console.log('Scores:', test2Result.scores);
console.log('Expected: radio');
console.log('Result:', test2Result.type === 'radio' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 3: Question with feedback keyword BUT has options
console.log('Test 3: "Feedback" keyword WITH options should be radio');
const test3Question = 'What is your feedback on the service?';
const test3NextLines = ['( ) Very positive', '( ) Positive', '( ) Neutral', '( ) Negative', '( ) Very negative'];
const test3Result = classifyQuestionType(test3Question, test3NextLines);
console.log('Question:', test3Question);
console.log('Options:', test3NextLines.length);
console.log('Detected type:', test3Result.type);
console.log('Scores:', test3Result.scores);
console.log('Expected: radio (5 options should override "feedback")');
console.log('Result:', test3Result.type === 'radio' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 4: Textarea question WITHOUT options should still be textarea
console.log('Test 4: "Please describe" WITHOUT options should be textarea');
const test4Question = 'Please describe your experience in detail';
const test4NextLines = ['', '5.2 Next question'];
const test4Result = classifyQuestionType(test4Question, test4NextLines);
console.log('Question:', test4Question);
console.log('Options:', 0);
console.log('Detected type:', test4Result.type);
console.log('Scores:', test4Result.scores);
console.log('Expected: textarea');
console.log('Result:', test4Result.type === 'textarea' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 5: Albanian "shpjegoni" (explain) WITH options
console.log('Test 5: Albanian "shpjegoni" WITH options should be radio');
const test5Question = 'Si do ta shpjegoni përvojën tuaj?';
const test5NextLines = ['( ) Shkëlqyeshëm', '( ) Mirë', '( ) Mesatare', '( ) Keq'];
const test5Result = classifyQuestionType(test5Question, test5NextLines);
console.log('Question:', test5Question);
console.log('Options:', test5NextLines.length);
console.log('Detected type:', test5Result.type);
console.log('Scores:', test5Result.scores);
console.log('Expected: radio');
console.log('Result:', test5Result.type === 'radio' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 6: Long question text WITH options should be radio
console.log('Test 6: Very long question WITH 5 options should be radio');
const test6Question = 'Based on your overall experience with our service, considering all aspects including quality, responsiveness, and professionalism, how would you rate your satisfaction?';
const test6NextLines = ['( ) Extremely satisfied', '( ) Very satisfied', '( ) Satisfied', '( ) Somewhat satisfied', '( ) Not satisfied'];
const test6Result = classifyQuestionType(test6Question, test6NextLines);
console.log('Question:', test6Question.substring(0, 80) + '...');
console.log('Options:', test6NextLines.length);
console.log('Detected type:', test6Result.type);
console.log('Scores:', test6Result.scores);
console.log('Expected: radio (5 options should override long question text)');
console.log('Result:', test6Result.type === 'radio' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 7: "Comment" keyword WITH 3 options (edge case)
console.log('Test 7: "Comment" keyword WITH 3 options should be radio');
const test7Question = 'How do you comment on the quality?';
const test7NextLines = ['( ) Excellent', '( ) Good', '( ) Poor'];
const test7Result = classifyQuestionType(test7Question, test7NextLines);
console.log('Question:', test7Question);
console.log('Options:', test7NextLines.length);
console.log('Detected type:', test7Result.type);
console.log('Scores:', test7Result.scores);
console.log('Expected: radio (3+ options should zero out textarea)');
console.log('Result:', test7Result.type === 'radio' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 8: Actual textarea - strong keyword with NO options
console.log('Test 8: "Ju lutem shkruani" WITHOUT options should be textarea');
const test8Question = 'Ju lutem shkruani komentet tuaja';
const test8NextLines = ['', '6.1 Next question'];
const test8Result = classifyQuestionType(test8Question, test8NextLines);
console.log('Question:', test8Question);
console.log('Options:', 0);
console.log('Detected type:', test8Result.type);
console.log('Expected: textarea');
console.log('Result:', test8Result.type === 'textarea' ? '✓ PASS' : '✗ FAIL');
console.log();

console.log('\n=== Summary ===');
const tests = [test1Result.type === 'radio', test2Result.type === 'radio', test3Result.type === 'radio',
               test4Result.type === 'textarea', test5Result.type === 'radio', test6Result.type === 'radio',
               test7Result.type === 'radio', test8Result.type === 'textarea'];
const passed = tests.filter(t => t).length;
console.log(`${passed}/${tests.length} tests passed`);
console.log(passed === tests.length ? '\n✓ All tests PASSED!' : '\n✗ Some tests FAILED');
