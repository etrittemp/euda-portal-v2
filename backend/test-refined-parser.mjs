import mammoth from 'mammoth';
import fs from 'fs/promises';

// Copy the key functions from file-upload.js for testing

function cleanEmbeddedLineNumbers(text) {
  if (!text) return text;
  let cleaned = text.replace(/\s+(\d{2,4})([A-ZÀČÇĐËĚÉÌÍŁŃÒÓŘŠŚŤÙÚÝŽАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ])/g, ' $2');
  cleaned = cleaned.replace(/\s+\d{2,4}\s+/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

function extractOptions(lines, startIndex, processedLines, questionType) {
  const options = [];
  let i = startIndex;

  // First, skip any instructional lines (parenthetical)
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
    const cleanLine = cleanEmbeddedLineNumbers(line);

    // Stop conditions
    if (!line) break;
    if (line.match(/^\d+\.\d+/)) break; // Next question with hierarchical numbering
    if (line.match(/^Section\s+[A-Z]|^Part\s+[A-Z]/i)) break;
    if (line.match(/^_{3,}/)) { i++; continue; }

    // ONLY stop for standalone textarea lines (not part of option text)
    const isStandaloneTextareaPrompt = !line.match(/^\(\s*\)|^\[\s*\]|^\*|^•|^-|^[a-z]\)|^\d+\)/) &&
                                       /^ju\s+lutem\s+shkruani|^lini.*koment|^përgjigjen\s+tuaj|^napišite|^napisite|^please\s+write/i.test(cleanLine);

    if (isStandaloneTextareaPrompt && options.length > 0) {
      break;
    }

    // Pattern matching for options
    let optionText = null;
    let value = null;

    // Standard patterns
    if (cleanLine.match(/^\(\s*\)/)) {
      optionText = cleanLine.replace(/^\(\s*\)/, '').trim();
      value = `option_${options.length + 1}`;
      processedLines.add(i);
    } else if (cleanLine.match(/^\[\s*\]/)) {
      optionText = cleanLine.replace(/^\[\s*\]/, '').trim();
      value = `option_${options.length + 1}`;
      processedLines.add(i);
    } else if (cleanLine.match(/^[a-z]\)\s+/)) {
      optionText = cleanLine.replace(/^[a-z]\)\s+/, '').trim();
      value = `option_${options.length + 1}`;
      processedLines.add(i);
    } else if (cleanLine.match(/^\d+\)\s+/)) {
      optionText = cleanLine.replace(/^\d+\)\s+/, '').trim();
      value = `option_${options.length + 1}`;
      processedLines.add(i);
    } else if (cleanLine.match(/^[•\-\*]\s+/)) {
      optionText = cleanLine.replace(/^[•\-\*]\s+/, '').trim();
      value = `option_${options.length + 1}`;
      processedLines.add(i);
    } else if (options.length > 0 || (questionType && ['radio', 'checkbox'].includes(questionType))) {
      // Plain text options (Albanian pattern)
      const isShortPhrase = cleanLine.length < 150 && cleanLine.split(/\s+/).length <= 15;
      const isYesNo = /^(po|jo|yes|no|da|ne|так|нет)$/i.test(cleanLine);

      if (isShortPhrase || isYesNo) {
        optionText = cleanLine;
        value = `option_${options.length + 1}`;
        processedLines.add(i);
      } else {
        break;
      }
    } else {
      break;
    }

    if (optionText) {
      // IMPROVED: Detect "Other" option - more flexible detection
      const hasOtherKeyword = /other|tjetër|tjeter|drugo|άλλο|altro|autre|otro/i.test(optionText);
      const hasSpecifyKeyword = /specify|specifikoni|navedite|уточните|préciser|especificar|:/i.test(optionText);
      const hasCustomPhrases = /write|shkruani|napišite|escribir|écrire|custom|personalizuar|prilagođeni/i.test(optionText);

      const allowsCustomInput = hasOtherKeyword && (hasSpecifyKeyword || hasCustomPhrases || optionText.includes(':'));

      options.push({
        value: value,
        label: {
          en: optionText,
          sq: optionText,
          sr: optionText
        },
        allowsCustomInput: allowsCustomInput
      });

      if (allowsCustomInput) {
        console.log('[OPTIONS] Detected custom input option:', optionText);
      }
    }

    i++;
  }

  // POST-PROCESSING: If no option was marked with allowsCustomInput,
  // check if the LAST option looks like "Other" and mark it
  if (options.length > 0) {
    const lastOption = options[options.length - 1];
    if (!lastOption.allowsCustomInput) {
      const lastText = lastOption.label.en.toLowerCase();
      if (/other|tjetër|tjeter|drugo|άλλο|altro|autre|otro/.test(lastText)) {
        lastOption.allowsCustomInput = true;
        console.log('[OPTIONS] Marked last option as allowing custom input:', lastOption.label.en);
      }
    }
  }

  return options;
}

// Test cases
console.log('=== Testing Refined Option Detection ===\n');

// Test 1: Last option with "Tjetër" should allow custom input
console.log('Test 1: Last option with "Tjetër" keyword');
const test1Lines = [
  '( ) Po',
  '( ) Jo',
  '( ) Tjetër'
];
const test1ProcessedLines = new Set();
const test1Options = extractOptions(test1Lines, 0, test1ProcessedLines, 'radio');
console.log('Options found:', test1Options.length);
console.log('Last option allows custom input:', test1Options[test1Options.length - 1]?.allowsCustomInput);
console.log('Expected: true');
console.log('Result:', test1Options[test1Options.length - 1]?.allowsCustomInput === true ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 2: "Other" with specify keyword
console.log('Test 2: Other option with "specify" keyword');
const test2Lines = [
  '( ) Option 1',
  '( ) Option 2',
  '( ) Other: please specify'
];
const test2ProcessedLines = new Set();
const test2Options = extractOptions(test2Lines, 0, test2ProcessedLines, 'radio');
console.log('Options found:', test2Options.length);
console.log('Last option allows custom input:', test2Options[test2Options.length - 1]?.allowsCustomInput);
console.log('Expected: true');
console.log('Result:', test2Options[test2Options.length - 1]?.allowsCustomInput === true ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 3: Multiple choice without stopping prematurely
console.log('Test 3: Multiple choice options should not stop early');
const test3Lines = [
  '( ) Mjaft e kënaqur',
  '( ) Mesatarisht e kënaqur',
  '( ) As e kënaqur as e pakënaqur',
  '( ) Pakënaqur',
  '( ) Shumë pakënaqur',
  '',
  '3.2 Question text here'
];
const test3ProcessedLines = new Set();
const test3Options = extractOptions(test3Lines, 0, test3ProcessedLines, 'radio');
console.log('Options found:', test3Options.length);
console.log('Expected: 5 options');
console.log('Result:', test3Options.length === 5 ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 4: Textarea prompt should not be treated as option
console.log('Test 4: Textarea prompt should stop option extraction');
const test4Lines = [
  '( ) Po',
  '( ) Jo',
  'Ju lutem shkruani përgjigjen tuaj'
];
const test4ProcessedLines = new Set();
const test4Options = extractOptions(test4Lines, 0, test4ProcessedLines, 'radio');
console.log('Options found:', test4Options.length);
console.log('Expected: 2 options (textarea prompt should stop extraction)');
console.log('Result:', test4Options.length === 2 ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 5: Plain text options (Albanian pattern)
console.log('Test 5: Plain text Yes/No options');
const test5Lines = [
  'Po',
  'Jo',
  '',
  '3.3 Next question'
];
const test5ProcessedLines = new Set();
const test5Options = extractOptions(test5Lines, 0, test5ProcessedLines, 'radio');
console.log('Options found:', test5Options.length);
console.log('Expected: 2 options');
console.log('Result:', test5Options.length === 2 ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 6: "Drugo" (Serbian "Other")
console.log('Test 6: Serbian "Drugo" as last option');
const test6Lines = [
  '( ) Да',
  '( ) Не',
  '( ) Drugo'
];
const test6ProcessedLines = new Set();
const test6Options = extractOptions(test6Lines, 0, test6ProcessedLines, 'radio');
console.log('Options found:', test6Options.length);
console.log('Last option allows custom input:', test6Options[test6Options.length - 1]?.allowsCustomInput);
console.log('Expected: true');
console.log('Result:', test6Options[test6Options.length - 1]?.allowsCustomInput === true ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 7: Stop at next hierarchical question (3.1, 3.2, etc.)
console.log('Test 7: Should stop at hierarchical question number');
const test7Lines = [
  '( ) Option 1',
  '( ) Option 2',
  '3.2 A ndihet konsideratë ndaj nevojave dhe shqetësimeve të juaja?'
];
const test7ProcessedLines = new Set();
const test7Options = extractOptions(test7Lines, 0, test7ProcessedLines, 'radio');
console.log('Options found:', test7Options.length);
console.log('Expected: 2 options (should stop at 3.2)');
console.log('Result:', test7Options.length === 2 ? '✓ PASS' : '✗ FAIL');
console.log();

console.log('\n=== Summary ===');
console.log('All tests completed. Check results above for any failures.');
