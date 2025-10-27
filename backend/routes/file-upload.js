import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import pdfParse from '../utils/pdf-parser.js';
import { supabase } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { parseTextToQuestionnaireAdvanced } from './advanced-parser.js';

const router = express.Router();

// ============================================
// ADVANCED CONFIGURATION
// ============================================

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
});

// ============================================
// NLP-INSPIRED FEATURE EXTRACTION
// ============================================

/**
 * Extract linguistic features from question text
 * Multi-language support: English (EN), Albanian (SQ), Serbian (SR)
 * Based on 2025 NLP best practices: POS tagging, NER patterns, dependency parsing indicators
 */
function extractLinguisticFeatures(text) {
  const lower = text.toLowerCase();

  return {
    // Interrogative patterns (WH-questions) - EN/SQ/SR
    hasWho: /\b(who|whom|whose|kush|ko|ko je)\b/i.test(text),
    hasWhat: /\b(what|what's|çfarë|cfare|sta|šta|sto)\b/i.test(text),
    hasWhen: /\b(when|what time|kur|kada|kad)\b/i.test(text),
    hasWhere: /\b(where|ku|gde|gdje)\b/i.test(text),
    hasWhy: /\b(why|pse|zašto|zasto)\b/i.test(text),
    hasHow: /\b(how|how many|how much|how often|how long|si|sa|koliko|kako)\b/i.test(text),
    hasWhich: /\b(which|cili|cilët|cilet|koji|koja)\b/i.test(text),

    // Modal verbs indicating preference/opinion - EN/SQ/SR
    hasWould: /\b(would|could|should|might|do të|dote|duhet|би|trebalo bi)\b/i.test(text),
    hasPrefer: /\b(prefer|preference|like|love|enjoy|favorite|preferoj|pëlqej|pelqej|преферирам|volim)\b/i.test(text),

    // Temporal indicators - EN/SQ/SR
    hasTemporal: /\b(date|time|year|month|day|week|yesterday|today|tomorrow|when|schedule|deadline|data|koha|viti|muaji|dita|javë|jave|dje|sot|nesër|neser|datum|vreme|godina|mesec|dan|nedelja|juče|juce|danas|sutra)\b/i.test(text),
    hasFrequency: /\b(often|frequency|daily|weekly|monthly|yearly|always|never|sometimes|regularly|shpesh|frekuencë|frekuence|përditshëm|perditshëm|perditshme|javor|mujor|vjetor|gjithmonë|gjithmone|kurrë|kurre|ndonjëherë|ndonjehere|često|cesto|svakodnevno|nedeljno|mesečno|mesecno|godišnje|godisnje|uvek|nikad|ponekad)\b/i.test(text),

    // Quantitative indicators - EN/SQ/SR
    hasQuantity: /\b(how many|number of|count|quantity|amount|total|sum|sa|numri|sasia|totali|broj|količina|kolicina|zbir)\b/i.test(text),
    hasNumeric: /\b(age|years old|score|rating|percentage|rate|mosha|vjeç|vjec|pikë|pike|përqindje|perqindje|godine|godina)\b/i.test(text),
    hasScale: /\b(scale|rate|rating|rank|grade|level|from \d+ to \d+|out of \d+|\d+-point|shkallë|shkalle|nivel|rangoj|скала|skala|nivo|ранг|rang)\b/i.test(text),

    // Qualitative/descriptive indicators - EN/SQ/SR
    hasDescribe: /\b(describe|explain|elaborate|tell us|share|detail|discuss|përshkruani|pershkruani|shpjegoni|sqaroni|detajoj|diskutoni|diskuto|opišite|opisite|objasnite|detaljno|razgovarajte)\b/i.test(text),
    hasOpinion: /\b(opinion|think|believe|feel|thoughts|view|perspective|mendimi|mendoj|besoj|ndjej|këndvështrim|kendveshtrim|mišljenje|misljenje|misliti|verovati|osećati|osecati|perspektiva)\b/i.test(text),
    hasFeedback: /\b(feedback|comment|suggestion|input|remarks|notes|koment|sugjerim|vërejtje|verejtje|shënime|shenime|povratna informacija|komentar|sugestija|napomene)\b/i.test(text),

    // Multiple choice indicators - EN/SQ/SR
    hasSelect: /\b(select|choose|pick|mark|zgjidhni|zgjidh|shënoni|shenoni|izaberite|odaberite|označite|oznacite)\b/i.test(text),
    hasAll: /\b(all that apply|all applicable|multiple|up to \d+|të gjitha|te gjitha|shumëfish|shumefish|sve što|sve sto|višestruki|visestruki|više|vise)\b/i.test(text),
    hasOne: /\b(one|single|only one|vetëm një|vetem nje|një|nje|jedan|само један|samo jedan)\b/i.test(text),

    // Binary indicators
    hasBinary: /\b(yes\/no|true\/false|agree\/disagree)\b/i.test(text),

    // Contact/identity indicators
    hasEmail: /\b(email|e-mail|email address)\b/i.test(text),
    hasPhone: /\b(phone|telephone|mobile|cell|contact number)\b/i.test(text),
    hasName: /\b(name|first name|last name|full name)\b/i.test(text),
    hasAddress: /\b(address|street|city|zip|postal code|location)\b/i.test(text),
    hasUrl: /\b(website|url|link|web address|homepage|http)\b/i.test(text),

    // Ranking/priority indicators
    hasRank: /\b(rank|order|priority|prioritize|arrange|sequence)\b/i.test(text),
    hasImportance: /\b(importance|important|most|least|priority)\b/i.test(text),

    // Text length indicators
    wordCount: text.split(/\s+/).length,
    hasLongAnswer: /\b(maximum|up to \d+ words|brief|short|long)\b/i.test(text),

    // Sentiment/agreement scales
    hasAgreement: /\b(strongly agree|agree|neutral|disagree|strongly disagree|satisfaction|satisfied)\b/i.test(text),
    hasLikert: /\b(strongly|somewhat|neither|not at all)\b/i.test(text),

    // File upload indicators
    hasUpload: /\b(upload|attach|file|document|image|photo|resume|cv)\b/i.test(text),

    // Required/mandatory indicators
    hasRequired: text.includes('*') || /\b(required|mandatory|must|necessary)\b/i.test(text),
    hasOptional: /\b(optional|if applicable|if any)\b/i.test(text)
  };
}

/**
 * Analyze context from surrounding lines
 * Implements look-ahead and look-behind analysis
 */
function analyzeContext(lines, currentIndex, windowSize = 5) {
  const context = {
    before: lines.slice(Math.max(0, currentIndex - windowSize), currentIndex),
    after: lines.slice(currentIndex + 1, Math.min(lines.length, currentIndex + windowSize + 1))
  };

  return {
    hasOptionsAfter: context.after.some(l => l.trim().match(/^[\(\[\*\-•●]\s*[\)\]]?\s*.+/)),
    hasScaleAfter: context.after.some(l => l.trim().match(/[\(\[]\s*[\)\]]\s*\d+/)),
    hasBlankAfter: context.after.some(l => l.trim().match(/_{3,}|\[.*\]/)),
    optionCount: context.after.filter(l => l.trim().match(/^[\(\[\*\-•●]\s*[\)\]]?\s*.+/)).length,
    hasInstructions: context.before.some(l => /instruction|note|please|important/i.test(l.trim()))
  };
}

// ============================================
// ADVANCED QUESTION TYPE CLASSIFIER
// Using ML-inspired multi-feature heuristic approach
// ============================================

/**
 * Clean embedded line numbers from text
 * Albanian documents have line numbers like "118Text" or "text 118 text"
 */
function cleanEmbeddedLineNumbers(text) {
  if (!text) return text;

  // Remove "118Text" pattern (number + capital letter)
  let cleaned = text.replace(/\s+(\d{2,4})([A-ZÀČÇĐËĚÉÌÍŁŃÒÓŘŠŚŤÙÚÝŽАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ])/g, ' $2');

  // Remove standalone numbers between words
  cleaned = cleaned.replace(/\s+\d{2,4}\s+/g, ' ');

  // Clean multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Advanced question type detection using feature-based classification
 * Inspired by 2025 NLP best practices: Named Entity Recognition,
 * dependency parsing, and contextual embeddings
 */
function classifyQuestionType(questionText, nextLines, strongTexts, htmlContext = null) {
  // Step 1: Clean embedded line numbers first
  const cleanedText = cleanEmbeddedLineNumbers(questionText);
  const cleanedNextLines = nextLines.map(l => cleanEmbeddedLineNumbers(l));

  const features = extractLinguisticFeatures(cleanedText);
  const context = analyzeContext([cleanedText, ...cleanedNextLines], 0, 10);

  // Confidence scoring for each type
  const scores = {
    email: 0,
    phone: 0,
    url: 0,
    date: 0,
    time: 0,
    number: 0,
    radio: 0,
    checkbox: 0,
    select: 0,
    textarea: 0,
    text: 0,
    rating: 0,
    slider: 0,
    file: 0
  };

  // Step 2: STRONG TEXTAREA OVERRIDE - Multi-language
  // BUT only if there are NO options present
  const textareaKeywords = /lini.*koment|ju\s+lutem\s+shkruani|ju\s+lutem.*shkruani|përgjigjen\s+tuaj|pergjigjen\s+tuaj|napišite|napisite|molimo.*napišite|ostavite.*komentar|please\s+write|write\s+your\s+answer|write.*here|leave.*comment/i;

  // CRITICAL: Only apply textarea override if NO options are present
  if (!context.hasOptionsAfter) {
    if (textareaKeywords.test(cleanedText)) {
      return { type: 'textarea', confidence: 0.99 };
    }

    // Check next lines for textarea indicators
    const nextFewLines = cleanedNextLines.slice(0, 3).join(' ');
    if (textareaKeywords.test(nextFewLines)) {
      return { type: 'textarea', confidence: 0.98 };
    }
  }

  // ===== FILE UPLOAD DETECTION =====
  if (features.hasUpload) {
    scores.file += 100;
    return { type: 'file', confidence: 0.95 };
  }

  // ===== EMAIL DETECTION =====
  if (features.hasEmail) {
    scores.email += 80;
  }
  if (/email/i.test(questionText) && !features.hasSelect) {
    scores.email += 50;
  }

  // ===== PHONE DETECTION =====
  if (features.hasPhone) {
    scores.phone += 80;
  }

  // ===== URL DETECTION =====
  if (features.hasUrl) {
    scores.url += 80;
  }
  if (/website|url|link/i.test(questionText)) {
    scores.url += 40;
  }

  // ===== DATE/TIME DETECTION =====
  if (features.hasTemporal && !features.hasSelect) {
    scores.date += 60;
  }
  if (/\bdate\b|birth|dob|when did|when will/i.test(questionText) && !context.hasOptionsAfter) {
    scores.date += 50;
  }
  if (/\btime\b|hour|minute|am|pm/i.test(questionText) && !context.hasOptionsAfter) {
    scores.time += 60;
  }

  // ===== NUMBER DETECTION =====
  if (features.hasQuantity) {
    scores.number += 70;
  }
  if (features.hasNumeric && !features.hasScale) {
    scores.number += 50;
  }
  if (/\bhow many\b|\bnumber of\b/i.test(questionText) && !context.hasOptionsAfter) {
    scores.number += 60;
  }
  if (/\bage\b|years old/i.test(questionText) && !context.hasOptionsAfter) {
    scores.number += 70;
  }

  // ===== SCALE/RATING DETECTION (Advanced Likert detection) =====
  if (features.hasScale) {
    scores.rating += 80;
    scores.radio += 40;
  }
  if (features.hasAgreement) {
    scores.rating += 70;
    scores.radio += 50;
  }
  if (features.hasLikert) {
    scores.rating += 60;
    scores.radio += 40;
  }
  if (context.hasScaleAfter) {
    scores.rating += 50;
    scores.radio += 60;
  }
  // Detect numeric scales like "1 to 5", "1-10"
  if (/\b(\d+)\s*(to|-|through)\s*(\d+)\b/.test(questionText)) {
    scores.rating += 70;
    scores.radio += 50;
  }
  // Slider for continuous scales
  if (/slider|continuous|spectrum/i.test(questionText)) {
    scores.slider += 80;
  }

  // ===== RANKING DETECTION =====
  if (features.hasRank && features.hasImportance) {
    scores.textarea += 40; // Complex ranking often needs text explanation
    scores.checkbox += 30; // Or multi-select with order
  }
  if (/rank.*order|order.*importance|top \d+|first.*second.*third/i.test(questionText)) {
    scores.textarea += 50;
  }

  // ===== CHECKBOX DETECTION (Multiple selection) - ENHANCED 2025 with Multi-language =====
  if (features.hasAll) {
    scores.checkbox += 90;
  }
  // EN/SQ/SR patterns for "select all" / "multiple"
  if (/select all|check all|mark all|choose all|multiple|up to \d+|zgjidhni të gjitha|zgjidhni te gjitha|të gjitha që|te gjitha qe|shumëfish|shumefish|izaberite sve|odaberite sve|višestruki|visestruki/i.test(questionText)) {
    scores.checkbox += 80;
  }
  // Albanian/Serbian "choose all that apply" in parentheses
  if (/\(.*zgjidhni.*të gjitha.*\)/i.test(questionText) || /\(.*izaberite.*sve.*\)/i.test(questionText)) {
    scores.checkbox += 80;
  }
  // Enhanced bracket pattern detection with multiple formats
  const hasBrackets = nextLines.some(l =>
    l.match(/^\[\s*\]/) ||           // [ ] Option
    l.match(/^\[x\]/) ||             // [x] Option (checked)
    l.match(/^\[X\]/) ||             // [X] Option (checked)
    l.match(/^☑️/) ||                 // Checkbox emoji
    l.match(/^▢/)                    // Checkbox symbol
  );
  if (hasBrackets) {
    scores.checkbox += 100;
    scores.radio = Math.max(0, scores.radio - 50); // Reduce radio confidence
  }

  // ===== RADIO DETECTION (Single selection) - ENHANCED 2025 with Multi-language =====
  if (features.hasOne && features.hasSelect) {
    scores.radio += 70;
  }
  // EN/SQ/SR patterns for "select one"
  if (/select one|choose one|pick one|single choice|zgjidhni vetëm një|zgjidhni vetem nje|zgjidh një|zgjidh nje|izaberite jedan|odaberite jedan/i.test(questionText)) {
    scores.radio += 80;
  }
  // Albanian/Serbian "choose one" in parentheses (common pattern)
  if (/\(.*zgjidhni.*vetëm.*një.*\)/i.test(questionText) || /\(.*izaberite.*jedan.*\)/i.test(questionText)) {
    scores.radio += 80;
  }
  // Enhanced parentheses pattern detection with multiple formats
  const hasParentheses = nextLines.some(l =>
    l.match(/^\(\s*\)\s+[A-Za-z]/) ||  // ( ) Option
    l.match(/^\(x\)\s+[A-Za-z]/) ||    // (x) Option (checked)
    l.match(/^\(X\)\s+[A-Za-z]/) ||    // (X) Option (checked)
    l.match(/^⚪/) ||                   // Radio emoji
    l.match(/^○/) ||                   // Radio symbol
    l.match(/^◯/)                      // Radio symbol alt
  );
  if (hasParentheses) {
    scores.radio += 100;
    scores.checkbox = Math.max(0, scores.checkbox - 50); // Reduce checkbox confidence
  }

  // ===== RADIO/MULTIPLE CHOICE DETECTION - Any question with options =====
  // Detect common option patterns and boost radio (multiple choice)
  const hasOptions = nextLines.some(l => /^[\(\[\*\-•●]\s*[\)\]]?\s*.+/.test(l.trim()));
  if (hasOptions) {
    scores.radio += 150; // Strong preference for radio when options are present
    console.log('[DETECTION] Found options - defaulting to multiple choice (radio)');
  }

  // ===== SELECT DROPDOWN DETECTION =====
  if (context.optionCount > 10 && !features.hasAll) {
    scores.select += 60; // Many options suggest dropdown
    scores.radio -= 20;
  }

  // ===== TEXTAREA DETECTION (Long-form text) - ENHANCED 2025 =====
  if (features.hasDescribe) {
    scores.textarea += 70;
  }
  if (features.hasOpinion || features.hasFeedback) {
    scores.textarea += 60;
  }
  if (features.hasWhy) {
    scores.textarea += 50; // "Why" questions need explanation
  }
  // Enhanced keyword detection for long-form responses (EN/SQ/SR)
  if (/explain|elaborate|detail|discuss|comment|feedback|thoughts|describe|summarize|analyze|justify|argue|shpjegoni|sqaroni|përshkruani|pershkruani|diskutoni|koment|mendimi|opišite|opisite|objasnite|komentar/i.test(questionText)) {
    scores.textarea += 70;
  }
  // "Please provide" or "Tell us about" patterns (EN/SQ/SR)
  if (/please provide|tell us about|share your|in your own words|give us|provide details|ju lutem|ju lutemi|shkruani|shkruaj|lini një koment|lini nje koment|napišite|napisite|molimo|ostavite komentar/i.test(questionText)) {
    scores.textarea += 65;
  }
  if (features.hasLongAnswer) {
    scores.textarea += 60;
  }
  if (context.hasBlankAfter && !context.hasOptionsAfter) {
    scores.textarea += 40;
  }
  if (features.wordCount > 20) {
    scores.textarea += 30; // Long questions often need long answers
  }
  // Multiple sentence questions often need paragraph responses
  if ((questionText.match(/\./g) || []).length > 1) {
    scores.textarea += 25;
  }

  // ===== TEXT DETECTION (Short-form text) - ENHANCED 2025 =====
  if (features.hasName && !context.hasOptionsAfter) {
    scores.text += 80;
  }
  // Short answer keywords
  if (/what is your|enter your|provide your|your name|organization|title|position/i.test(questionText)) {
    scores.text += 65;
  }
  if ((features.hasWhat || features.hasWho || features.hasWhere) &&
      !context.hasOptionsAfter &&
      !features.hasDescribe &&
      features.wordCount < 15) {
    scores.text += 50;
  }
  if (context.hasBlankAfter && features.wordCount < 12) {
    scores.text += 40;
  }
  // Single word expected answers
  if (/in one word|briefly|short answer/i.test(questionText)) {
    scores.text += 70;
    scores.textarea = Math.max(0, scores.textarea - 40);
  }

  // ===== CONTEXT-BASED ADJUSTMENTS =====
  // If we have options, prioritize selection types STRONGLY
  if (context.hasOptionsAfter) {
    // Aggressively reduce non-selection types when options are present
    scores.text = Math.max(0, scores.text - 100);
    scores.textarea = Math.max(0, scores.textarea - 150); // Strong reduction for textarea
    scores.number = Math.max(0, scores.number - 80);
    scores.date = Math.max(0, scores.date - 80);

    // Boost selection types significantly when options are detected
    if (scores.radio > 0) scores.radio += 100;
    if (scores.checkbox > 0) scores.checkbox += 50;

    // If we have 1+ options, it's definitely a selection type - default to radio (multiple choice)
    if (context.optionCount >= 1) {
      scores.textarea = 0; // Zero out textarea completely
      scores.text = 0; // Zero out text completely
      scores.radio += 200; // MASSIVE boost for radio when options present

      console.log('[RADIO-OVERRIDE] Found ' + context.optionCount + ' option(s) - forcing multiple choice (radio)');
    }
  }

  // If no options and asking for input, deprioritize selection types
  if (!context.hasOptionsAfter && !context.hasScaleAfter) {
    scores.radio = Math.max(0, scores.radio - 40);
    scores.checkbox = Math.max(0, scores.checkbox - 40);
    scores.select = Math.max(0, scores.select - 40);
  }

  // ===== DECISION: Pick highest score =====
  const maxScore = Math.max(...Object.values(scores));
  const bestType = Object.keys(scores).find(key => scores[key] === maxScore);
  const confidence = Math.min(maxScore / 100, 0.99);

  // Fallback logic with intelligence
  if (maxScore < 30) {
    // Very low confidence - use intelligent defaults
    if (features.wordCount > 15) return { type: 'textarea', confidence: 0.4 };
    if (context.hasBlankAfter) return { type: 'text', confidence: 0.4 };
    return { type: 'text', confidence: 0.3 };
  }

  return { type: bestType, confidence };
}

// ============================================
// TEXT EXTRACTION (Enhanced with metadata)
// ============================================

async function extractTextFromWord(buffer) {
  try {
    const rawResult = await mammoth.extractRawText({ buffer });
    const htmlResult = await mammoth.convertToHtml({ buffer });

    // Extract metadata from HTML
    const metadata = {
      hasBold: /<strong>|<b>/i.test(htmlResult.value),
      hasItalic: /<em>|<i>/i.test(htmlResult.value),
      hasUnderline: /<u>/i.test(htmlResult.value),
      hasList: /<ul>|<ol>/i.test(htmlResult.value),
      hasTable: /<table>/i.test(htmlResult.value)
    };

    return {
      text: rawResult.value,
      html: htmlResult.value,
      metadata
    };
  } catch (error) {
    console.error('Word extraction error:', error);
    throw new Error('Failed to extract text from Word document');
  }
}

async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      html: null,
      metadata: {
        pages: data.numpages,
        info: data.info
      }
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// ============================================
// ADVANCED PARSER with Multi-pass Analysis
// ============================================

function parseTextToQuestionnaire(extractedData) {
  const { text, html, metadata } = extractedData;
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  console.log('========================================');
  console.log('PARSING DEBUG - Total lines:', lines.length);
  console.log('First 10 lines:');
  lines.slice(0, 10).forEach((line, idx) => {
    console.log(`  ${idx + 1}: ${line.substring(0, 80)}`);
  });
  console.log('========================================');

  // Extract strong tags from HTML for better section/question detection
  const strongTexts = new Set();
  if (html) {
    const strongTags = html.match(/<strong>([^<]+)<\/strong>/g) || [];
    strongTags.forEach(tag => {
      const content = tag.replace(/<\/?strong>/g, '').trim();
      strongTexts.add(content);
    });
  }

  const sections = [];
  let currentSection = {
    title: { en: 'General Questions', sq: 'Pyetje të Përgjithshme', sr: 'Општа питања' },
    description: { en: '', sq: '', sr: '' },
    order_index: 0
  }; // Start with a default section instead of null
  let currentQuestions = [];
  let processedLines = new Set();

  // First pass: Identify document structure
  const structureMap = lines.map((line, idx) => {
    const questionResult = isQuestionLine(line);
    return {
      index: idx,
      line,
      isSection: isSectionHeader(line, strongTexts),
      isQuestion: questionResult.match,
      questionPattern: questionResult.pattern,
      questionConfidence: questionResult.confidence,
      isOption: isOptionLine(line),
      isBlank: isBlankLine(line)
    };
  });

  for (let i = 0; i < lines.length; i++) {
    if (processedLines.has(i)) continue;

    const line = lines[i];
    const structure = structureMap[i];

    // Skip meta content
    if (shouldSkipLine(line)) continue;

    // DETECT SECTIONS
    if (structure.isSection) {
      // Save previous section (always save, even if no questions)
      if (currentQuestions.length > 0) {
        sections.push({
          ...currentSection,
          questions: currentQuestions
        });
      } else if (sections.length > 0) {
        // Only save empty section if it's not the first default one
        sections.push({
          ...currentSection,
          questions: []
        });
      }

      // Clean section title using advanced function
      const cleanTitle = cleanSectionTitle(line);

      // Create new section
      currentSection = {
        title: { en: cleanTitle, sq: cleanTitle, sr: cleanTitle },
        description: { en: '', sq: '', sr: '' },
        order_index: sections.length
      };
      currentQuestions = [];
      processedLines.add(i);
      continue;
    }

    // DETECT QUESTIONS
    if (structure.isQuestion) {
      console.log(`[DEBUG] Found question at line ${i}: ${line.substring(0, 60)}`);
      const questionData = extractQuestion(lines, i, processedLines, strongTexts, structureMap, currentQuestions.length, html);
      if (questionData) {
        console.log(`[DEBUG] Extracted question ${questionData.question.question_number}: ${questionData.question.question_type}`);
        currentQuestions.push(questionData.question);
        // DON'T modify i here - let the loop continue naturally
        // The processedLines Set will prevent re-processing
      } else {
        console.log(`[DEBUG] Failed to extract question data`);
      }
    }
  }

  // Save final section (currentSection always exists now)
  console.log(`[DEBUG] Final save - currentQuestions.length: ${currentQuestions.length}`);
  if (currentQuestions.length > 0) {
    console.log(`[DEBUG] Saving final section with ${currentQuestions.length} questions`);
    sections.push({
      ...currentSection,
      questions: currentQuestions
    });
  }

  console.log(`[DEBUG] Total sections created: ${sections.length}`);
  sections.forEach((s, idx) => {
    console.log(`[DEBUG] Section ${idx + 1}: ${s.title.en} - ${s.questions?.length || 0} questions`);
  });

  // If still no sections (shouldn't happen with default section, but just in case)
  if (sections.length === 0 && currentQuestions.length > 0) {
    sections.push({
      title: { en: 'General Questions', sq: 'Pyetje të Përgjithshme', sr: 'Општа питања' },
      description: { en: '', sq: '', sr: '' },
      order_index: 0,
      questions: currentQuestions
    });
  }

  const totalQuestions = sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0);

  return {
    sections,
    metadata: {
      ...metadata,
      totalSections: sections.length,
      totalQuestions: totalQuestions
    }
  };
}

// ============================================
// HELPER FUNCTIONS for Structure Detection
// ============================================

function shouldSkipLine(line) {
  const lower = line.toLowerCase();
  return (
    lower.match(/^(introduction|thank\s+you|questionnaire|survey|the\s+ultimate)/i) &&
    !line.match(/^\d+\./)
  );
}

function isSectionHeader(line, strongTexts) {
  // Enhanced section detection with NUMBERED SECTIONS and SUBSECTIONS

  // 1. Comment-based section markers
  const isComment = line.match(/^\/\/\s*(.+)/) ||
                    line.match(/^#\s*(.+)/) ||
                    line.match(/^\/\*\s*(.+)\s*\*\//) ||
                    line.match(/^--\s*(.+)/) ||
                    line.match(/^;\s*(.+)/);

  // 2. Traditional section patterns
  const isSectionPattern = line.match(/^Section\s+[A-Z0-9]+:/i) ||
                          line.match(/^Part\s+[A-Z0-9]+:/i) ||
                          line.match(/^Chapter\s+[A-Z0-9]+:/i) ||
                          line.match(/^[IVX]+\.\s+[A-Z]/) ||
                          line.match(/^[A-Z]\.\s+[A-Z]/);

  // 3. NUMBERED SECTIONS: "3. Title" (single digit, NOT 3.1 which is a question)
  const isNumberedSection = line.match(/^(\d{1,2})\.\s+[A-ZÀČÇĐËĚÉÌÍŁŃÒÓŘŠŚŤÙÚÝŽАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ]/) &&
                           !line.match(/^\d+\.\d+/);

  // 4. SUBSECTIONS: "(1/12)" pattern
  const isSubsection = line.match(/\(\d+\/\d+\)/);

  // 5. Bold/strong text sections
  const isStrongSection = strongTexts.has(line) &&
                         (line.match(/^Section|^Part|^Chapter/i) || line.length < 60);

  // Use universal question detection
  const questionResult = isQuestionLine(line);
  const notQuestion = !questionResult.match || isNumberedSection || isSubsection;
  const notScaleIndicator = !line.match(/\(\s*\)\s+\d+\s+\(\s*\)\s+\d+/);

  const isSectionLength = line.length < 150 && line.length > 5;

  return (isComment || isSectionPattern || isNumberedSection || isSubsection || isStrongSection) &&
         notQuestion && notScaleIndicator && isSectionLength;
}

/**
 * Clean section title - preserve section numbers, remove trailing line numbers
 */
function cleanSectionTitle(line) {
  let cleanTitle = line
    .replace(/^\/\/\s*/, '')
    .replace(/^#\s*/, '')
    .replace(/^\/\*\s*/, '')
    .replace(/\s*\*\/$/, '')
    .replace(/^--\s*/, '')
    .replace(/^;\s*/, '')
    .trim();

  // Remove embedded line numbers while preserving section numbers
  cleanTitle = cleanEmbeddedLineNumbers(cleanTitle);

  // Remove trailing document line numbers (e.g., "Title 91" -> "Title")
  cleanTitle = cleanTitle.replace(/\s+\d{2,4}$/, '');

  return cleanTitle.trim();
}

/**
 * UNIVERSAL QUESTION DETECTION
 * Supports multiple numbering formats with confidence scoring
 */
function isQuestionLine(line) {
  const patterns = [
    // Hierarchical with letter suffix: 1.1.2.a, 1.2.b, 3.1.2.3.c, etc.
    { regex: /^((\d+\.)+\d+)\.[a-z]\s+.+/i, confidence: 0.95, type: 'hierarchical_letter' },

    // Hierarchical numbering: 1.1, 1.2.1, 1.2.2.3, etc.
    { regex: /^(\d+\.)+\d+\s+.+/, confidence: 0.95, type: 'hierarchical' },

    // Simple numbering: 1., 2., 3., etc.
    { regex: /^\d+\.\s+.+/, confidence: 0.95, type: 'simple' },

    // Numbered with parenthesis: 1), 2), 3), etc.
    { regex: /^\d+\)\s+.+/, confidence: 0.90, type: 'paren' },

    // Letter-based: A., B., C. or a., b., c.
    { regex: /^[A-Za-z]\.\s+.+/, confidence: 0.85, type: 'letter' },

    // Letter with parenthesis: A), B), C)
    { regex: /^[A-Za-z]\)\s+.+/, confidence: 0.85, type: 'letter_paren' },

    // Roman numerals: I., II., III., IV., etc.
    { regex: /^[IVX]+\.\s+.+/, confidence: 0.80, type: 'roman' },

    // Prefixed: Q1., Q2., Question 1., etc.
    { regex: /^(Q|Question)\s*\d+[\.\:]\s+.+/i, confidence: 0.90, type: 'prefixed' },

    // Bracketed: [1], [2], etc.
    { regex: /^\[\d+\]\s+.+/, confidence: 0.85, type: 'bracketed' },

    // Question mark pattern (intelligent detection)
    { regex: /^.{5,100}\?$/, confidence: 0.60, type: 'question_mark' }
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(line)) {
      return { match: true, pattern: pattern.type, confidence: pattern.confidence };
    }
  }

  // Intelligent question detection without numbering
  // Check for question indicators
  const hasQuestionWord = /^(what|who|when|where|why|how|which|whose|whom|can|could|would|should|do|does|did|is|are|was|were|have|has|had|will)/i.test(line);
  const endsWithQuestionMark = line.endsWith('?');
  const hasQuestionContext = line.length > 10 && line.length < 200 && (hasQuestionWord || endsWithQuestionMark);

  if (hasQuestionContext && endsWithQuestionMark) {
    return { match: true, pattern: 'intelligent', confidence: 0.70 };
  }

  return { match: false, pattern: null, confidence: 0 };
}

function isOptionLine(line) {
  return line.match(/^[\(\[\*\-•]\s*[\)\]]?\s*.+/);
}

function isBlankLine(line) {
  return line.match(/^_{3,}|^\[.*\]$|^\.\.\./);
}

/**
 * UNIVERSAL QUESTION NUMBER EXTRACTOR
 * Extracts question numbers from any format
 */
function extractQuestionNumber(line) {
  // Try all possible patterns
  const patterns = [
    // Hierarchical with letter suffix: 1.1.2.a, 1.2.b, etc. - preserve full hierarchy including letter
    { regex: /^((\d+\.)+\d+\.[a-z])\s+/i, extract: m => m[1] },

    // Hierarchical: 1.1, 1.2.1, etc. - preserve full hierarchy
    { regex: /^((\d+\.)+\d+)\s+/, extract: m => m[1] },

    // Simple: 1., 2., 3.
    { regex: /^(\d+)\.\s+/, extract: m => m[1] },

    // Parenthesis: 1), 2)
    { regex: /^(\d+)\)\s+/, extract: m => m[1] },

    // Letter: A., B., a., b.
    { regex: /^([A-Za-z])\.\s+/, extract: m => m[1] },

    // Letter parenthesis: A), B)
    { regex: /^([A-Za-z])\)\s+/, extract: m => m[1] },

    // Roman: I., II., III.
    { regex: /^([IVX]+)\.\s+/, extract: m => m[1] },

    // Prefixed: Q1., Question 1:
    { regex: /^(?:Q|Question)\s*(\d+)[\.\:]\s+/i, extract: m => m[1] },

    // Bracketed: [1], [2]
    { regex: /^\[(\d+)\]\s+/, extract: m => m[1] }
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

  // For intelligent detection without numbering, use line index
  return { number: null, text: line.trim(), format: 'intelligent' };
}

function extractQuestion(lines, startIndex, processedLines, strongTexts, structureMap, currentQuestionCount, htmlContext = null) {
  const line = lines[startIndex];

  // Use universal question number extractor
  const extracted = extractQuestionNumber(line);

  if (!extracted.text) return null;

  const questionNumber = extracted.number || String(startIndex + 1);
  let questionText = extracted.text;
  let currentIndex = startIndex;
  let helpText = '';

  // Multi-line question continuation (smarter detection)
  let j = startIndex + 1;
  while (j < lines.length && j < startIndex + 4) {
    const nextLine = lines[j];
    const nextStruct = structureMap[j];

    // Stop if we hit another question, section, or option
    if (nextStruct.isQuestion || nextStruct.isSection || nextStruct.isOption) break;
    if (nextStruct.isBlank) break;
    if (nextLine.match(/\(\s*\)\s+\d+\s+\(\s*\)\s+\d+/)) break; // Scale indicator

    // Continue if it looks like part of the question
    if (nextLine.length > 0 && !processedLines.has(j)) {
      questionText += ' ' + nextLine.trim();
      processedLines.add(j);
      j++;
    } else {
      break;
    }
  }

  currentIndex = j;

  // Extract parenthetical help text from plain text (e.g., "(Ju lutem zgjidhni vetëm një nga sa vijon:)")
  // Check the next few lines for help text in parentheses
  let k = currentIndex;
  const helpTextParts = [];
  while (k < lines.length && k < currentIndex + 3) {
    const helpLine = lines[k];

    // Stop if we hit options or next question
    if (helpLine.match(/^[\(\[\*\-•●]\s*[\)\]]?\s*[A-ZА-ЯËÇ]/)) break; // Options with content
    if (helpLine.match(/^\d+\.\d+/)) break; // Next question

    // Check if this line is wrapped in parentheses (help text pattern)
    const parentheticalMatch = helpLine.match(/^\s*\((.+)\)\s*\d*\s*$/);
    if (parentheticalMatch) {
      const helpContent = parentheticalMatch[1].trim();

      // Filter out option-like patterns and validate it's instructional text
      if (!helpContent.match(/^\s*[\)\]]/) && // Not an empty option marker
          !helpContent.match(/^Po[,\s]|^Jo[,\s]|^Yes[,\s]|^No[,\s]|^Да[,\s]|^Не[,\s]/i) && // Not yes/no
          helpContent.length > 10) { // Substantial text
        helpTextParts.push(helpContent);
        processedLines.add(k);
        k++;
        continue;
      }
    }

    // Stop if we hit a blank line or underscores (separator)
    if (!helpLine.trim() || helpLine.match(/^_{3,}/)) {
      break;
    }

    k++;
  }

  // Combine parenthetical help text parts
  if (helpTextParts.length > 0) {
    helpText = helpTextParts.join(' ');
    currentIndex = k;
  }

  // Extract italic text as help_text from HTML context (if no parenthetical text found)
  // Find italic text that appears IMMEDIATELY AFTER this question line but BEFORE any options or next question
  if (htmlContext && !helpText) {
    // Split HTML into sections
    const htmlLines = htmlContext.split(/<\/?p>/gi).filter(l => l.trim());

    // Find the current question in HTML
    const questionTextClean = questionText.substring(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let foundQuestion = false;
    let linesAfterQuestion = 0;

    for (const htmlLine of htmlLines) {
      // Clean HTML tags for matching
      const cleanHtmlLine = htmlLine.replace(/<[^>]+>/g, '').trim();

      if (htmlLine.includes(questionText.substring(0, 30))) {
        foundQuestion = true;
        continue;
      }

      // If we found the question, look for italic text in the VERY NEXT line(s) only
      if (foundQuestion) {
        linesAfterQuestion++;

        // Stop if we hit option markers - italic text after options is NOT help text for this question
        if (cleanHtmlLine.match(/^[\(\[\*\-•]\s*[\)\]]?/)) {
          break;
        }

        // Stop if we hit the next question
        if (cleanHtmlLine.match(/^\d+\.\d+/)) {
          break;
        }

        // Stop if we hit a section header
        if (cleanHtmlLine.match(/^(Section|Part|Anketa|\d+\.)\s+/i) && !cleanHtmlLine.match(/^\d+\.\d+/)) {
          break;
        }

        // Only look for italic text in the first 2 lines after the question
        if (linesAfterQuestion <= 2) {
          const italicMatch = htmlLine.match(/<(?:em|i)>([^<]+)<\/(?:em|i)>/i);
          if (italicMatch) {
            const potentialHelpText = italicMatch[1].trim();

            // Validate that it's actually help text, not an option or part of content
            // Help text should be relatively short and not look like an option
            if (potentialHelpText.length < 200 &&
                !potentialHelpText.match(/^[\(\[\*\-•]/) &&
                !potentialHelpText.match(/^\d+\./)) {
              helpText = potentialHelpText;
              break;
            }
          }
        } else {
          // Too far from the question - stop looking
          break;
        }
      }
    }
  }

  // Advanced question type detection
  const nextLines = lines.slice(currentIndex, currentIndex + 20);
  const classification = classifyQuestionType(questionText, nextLines, strongTexts);

  // Extract options if applicable
  let options = [];
  if (['radio', 'checkbox', 'select', 'rating'].includes(classification.type)) {
    const result = extractOptions(lines, currentIndex, processedLines, classification.type);
    options = result.options;
    currentIndex = result.endIndex;
  }

  // Detect if required
  const isRequired = questionText.includes('*') ||
                    questionText.match(/\(required\)/i) ||
                    questionText.match(/\(mandatory\)/i);

  // Create question with metadata
  // Store question_number as string to preserve hierarchical format (e.g., "1.2.1")
  const question = {
    question_number: questionNumber, // Keep as string for hierarchical support
    question_text: {
      en: questionText.replace(/\*$/, '').trim(),
      sq: questionText.replace(/\*$/, '').trim(),
      sr: questionText.replace(/\*$/, '').trim()
    },
    question_type: classification.type,
    options: options.length > 0 ? options : null,
    required: isRequired,
    order_index: currentQuestionCount, // Use sequential count instead of parsed number
    validation_rules: buildValidationRules(classification.type, questionText),
    help_text: helpText ? { en: helpText, sq: helpText, sr: helpText } : { en: '', sq: '', sr: '' },
    metadata: {
      confidence: classification.confidence,
      features: extractLinguisticFeatures(questionText)
    }
  };

  return {
    question,
    endIndex: currentIndex
  };
}

function buildValidationRules(questionType, questionText) {
  const rules = {};

  switch (questionType) {
    case 'number':
      rules.min = 0;
      // Extract range if specified
      const rangeMatch = questionText.match(/(\d+)\s*(?:to|-)\s*(\d+)/);
      if (rangeMatch) {
        rules.min = parseInt(rangeMatch[1]);
        rules.max = parseInt(rangeMatch[2]);
      }
      break;

    case 'text':
      rules.maxLength = 500;
      if (/email/i.test(questionText)) {
        rules.pattern = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
      }
      break;

    case 'textarea':
      rules.maxLength = 5000;
      const wordMatch = questionText.match(/(\d+)\s*words/i);
      if (wordMatch) {
        rules.maxWords = parseInt(wordMatch[1]);
      }
      break;

    case 'email':
      rules.pattern = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
      break;

    case 'url':
      rules.pattern = '^https?://';
      break;

    case 'phone':
      rules.pattern = '^[\\d\\s\\-\\+\\(\\)]+$';
      break;
  }

  return Object.keys(rules).length > 0 ? rules : null;
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
    if (line.match(/^Section\s+[A-Z]|^Part\s+[A-Z]/i)) break; // Next section
    if (line.match(/^_{3,}/)) { i++; continue; } // Skip blank fields

    // ONLY stop for standalone textarea lines (not part of option text)
    // Check if this is a standalone "Ju lutem shkruani" line (not part of an option)
    const isStandaloneTextareaPrompt = !line.match(/^\(\s*\)|^\[\s*\]|^\*|^•|^-|^[a-z]\)|^\d+\)/) &&
                                       /^ju\s+lutem\s+shkruani|^lini.*koment|^përgjigjen\s+tuaj|^napišite|^napisite|^please\s+write/i.test(cleanLine);

    if (isStandaloneTextareaPrompt && options.length > 0) {
      // We have options already, and hit a textarea prompt, so stop
      break;
    }

    // Advanced option pattern matching
    const patterns = [
      // Radio patterns (parentheses)
      { regex: /^\(\s*\)\s+(.+)/, type: 'radio_empty' },
      { regex: /^\([xX]\)\s+(.+)/, type: 'radio_checked' },
      { regex: /^[⚪○◯]\s*(.+)/, type: 'radio_symbol' },

      // Checkbox patterns (brackets)
      { regex: /^\[\s*\]\s+(.+)/, type: 'checkbox_empty' },
      { regex: /^\[[xX✓✔]\]\s+(.+)/, type: 'checkbox_checked' },
      { regex: /^[☑️▢]\s*(.+)/, type: 'checkbox_symbol' },

      // Bullet patterns
      { regex: /^\*\s+(.+)/, type: 'bullet_star' },
      { regex: /^•\s+(.+)/, type: 'bullet_dot' },
      { regex: /^●\s+(.+)/, type: 'bullet_filled' },  // Filled circle bullet (common in Albanian docs)
      { regex: /^-\s+(.+)/, type: 'bullet_dash' },
      { regex: /^➤\s+(.+)/, type: 'bullet_arrow' },

      // Letter options
      { regex: /^[a-z]\)\s+(.+)/i, type: 'letter_option' },
      { regex: /^[a-z]\.\s+(.+)/i, type: 'letter_dot' },

      // Numbered options
      { regex: /^\d+\)\s+(.+)/, type: 'numbered_paren' },
      { regex: /^\d+\.\s+(.+)/, type: 'numbered_dot' }
    ];

    // Skip scale indicator lines
    if (cleanLine.match(/[\(\[]\s*[\)\]]\s*\d+\s+[\(\[]\s*[\)\]]\s*\d+/)) {
      i++;
      continue;
    }

    let matched = false;
    for (const pattern of patterns) {
      const match = cleanLine.match(pattern.regex);
      if (match) {
        const optionText = match[1].trim();

        // IMPROVED: Detect "Other" option - more flexible detection
        const hasOtherKeyword = /other|tjetër|tjeter|drugo|άλλο|altro|autre|otro/i.test(optionText);
        const hasSpecifyKeyword = /specify|specifikoni|navedite|уточните|préciser|especificar|:/i.test(optionText);
        const hasCustomPhrases = /write|shkruani|napišite|escribir|écrire|custom|personalizuar|prilagođeni/i.test(optionText);

        // Allow custom input if it's "Other" with any indication of custom text
        const allowsCustomInput = hasOtherKeyword && (hasSpecifyKeyword || hasCustomPhrases || optionText.includes(':'));

        const option = {
          value: optionText.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
          label: { en: optionText, sq: optionText, sr: optionText },
          metadata: { pattern: pattern.type }
        };

        if (allowsCustomInput) {
          option.allowsCustomInput = true;
          console.log('[OPTIONS] Detected "Other" option with custom input:', optionText);
        }

        options.push(option);
        processedLines.add(i);
        matched = true;
        break;
      }
    }

    if (matched) {
      i++;
      continue;
    }

    // Plain text option detection for Albanian/Serbian documents
    // Only if we already have options OR question type is radio/checkbox
    if (options.length > 0 || questionType === 'radio' || questionType === 'checkbox') {
      const isShortLine = cleanLine.length < 150;
      const isNotInstruction = !cleanLine.match(/^\(.*\)$/);
      const isNotQuestionPrompt = !/^ju\s+lutem\s+shkruani|^please\s+write/i.test(cleanLine);
      const isNotQuestionMark = !cleanLine.includes('?');

      const looksLikeOption =
        cleanLine.match(/^(po|jo|да|da|ne|не|yes|no)$/i) ||
        cleanLine.match(/^(po|jo|да|da|ne|не|yes|no)\s*[,\.]/i) ||
        (isShortLine && isNotQuestionMark && cleanLine.split(' ').length <= 15);

      if (isShortLine && isNotInstruction && isNotQuestionPrompt && looksLikeOption) {
        // Detect "Other" in plain text
        const hasOtherKeyword = /other|tjetër|tjeter|drugo/i.test(cleanLine);
        const hasSpecifyKeyword = /specify|specifikoni|navedite|:/i.test(cleanLine);
        const allowsCustomInput = hasOtherKeyword && (hasSpecifyKeyword || cleanLine.includes(':'));

        const option = {
          value: cleanLine.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
          label: { en: cleanLine, sq: cleanLine, sr: cleanLine },
          metadata: { pattern: 'plain_text' }
        };

        if (allowsCustomInput) {
          option.allowsCustomInput = true;
          console.log('[OPTIONS] Detected plain text "Other" option:', cleanLine);
        }

        options.push(option);
        processedLines.add(i);
        i++;
        continue;
      }
    }

    // If we have options and this doesn't match, stop
    if (options.length > 0) break;

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

  // Generate scale options if it's a rating and we have few/no options
  if (questionType === 'rating' && options.length < 3) {
    const scaleMatch = lines.slice(Math.max(0, startIndex - 5), startIndex + 5)
      .join(' ')
      .match(/(\d+)\s*(?:to|-|through)\s*(\d+)/);

    if (scaleMatch) {
      const min = parseInt(scaleMatch[1]);
      const max = parseInt(scaleMatch[2]);
      options.length = 0; // Clear any partial options

      for (let val = min; val <= max; val++) {
        options.push({
          value: String(val),
          label: { en: String(val), sq: String(val), sr: String(val) },
          metadata: { generated: true, scale: true }
        });
      }
    }
  }

  return { options, endIndex: i };
}

// ============================================
// UPLOAD ENDPOINT
// ============================================

router.post('/convert', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Questionnaire title is required' });
    }

    // Extract text with metadata
    let extractedData;
    if (req.file.mimetype === 'application/pdf') {
      extractedData = await extractTextFromPDF(req.file.buffer);
    } else {
      extractedData = await extractTextFromWord(req.file.buffer);
    }

    if (!extractedData.text || extractedData.text.trim().length === 0) {
      return res.status(400).json({ error: 'No text could be extracted from the file' });
    }

    // TEMPORARY: Test with old parser to verify database compatibility
    console.log('[FILE UPLOAD] Using OLD parser (temporary test)...');
    console.log('[FILE UPLOAD] Text length:', extractedData.text?.length);
    console.log('[FILE UPLOAD] HTML length:', extractedData.html?.length);

    let parsedResult;
    let sections;

    try {
      parsedResult = parseTextToQuestionnaire(extractedData);  // OLD PARSER
      sections = parsedResult.sections;
      console.log('[FILE UPLOAD] OLD parser returned:', parsedResult ? 'SUCCESS' : 'NULL');
      console.log('[FILE UPLOAD] Sections count:', sections.length);
      console.log('[FILE UPLOAD] Total questions:', parsedResult.metadata.totalQuestions);
    } catch (parseError) {
      console.error('[FILE UPLOAD] Parser error:', parseError);
      console.error('[FILE UPLOAD] Parser stack:', parseError.stack);
      return res.status(500).json({
        error: 'Failed to parse document',
        details: parseError.message,
        stack: parseError.stack
      });
    }

    if (sections.length === 0) {
      console.error('[FILE UPLOAD] No sections detected!');
      return res.status(400).json({
        error: 'Could not detect any questions in the document',
        hint: 'Please ensure questions are numbered (e.g., "1. Question text")',
        extractedText: extractedData.text.substring(0, 500),
        parserMetadata: parsedResult?.metadata
      });
    }

    // Calculate confidence score
    const allQuestions = sections.flatMap(s => s.questions || []).filter(q => q);
    const avgConfidence = allQuestions.length > 0
      ? allQuestions.reduce((sum, q) => sum + (q.metadata?.confidence || 0), 0) / allQuestions.length
      : 0;

    // Prepare sections with cleaned questions (remove metadata and question_number)
    const cleanedSections = sections.map((section, index) => {
      const cleanedQuestions = (section.questions || []).map(q => {
        // Remove metadata and question_number - not needed in DB
        const { metadata, question_number, ...questionWithoutMeta } = q;
        return questionWithoutMeta;
      });

      return {
        id: `section-${Date.now()}-${index}`,
        title: section.title,
        description: section.description,
        order_index: section.order_index,
        questions: cleanedQuestions.map((q, qIndex) => ({
          ...q,
          id: `question-${Date.now()}-${index}-${qIndex}`
        }))
      };
    });

    // Create questionnaire with sections as JSONB
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .insert([{
        title,
        description: description || `Imported from ${req.file.originalname}`,
        status: 'draft',
        sections: cleanedSections, // Store sections as JSONB
        created_by: req.user.id
      }])
      .select()
      .single();

    if (qError) {
      console.error('Create questionnaire error:', qError);
      return res.status(500).json({ error: 'Failed to create questionnaire' });
    }

    const totalQuestionsInserted = allQuestions.length;
    console.log(`[DEBUG] Created questionnaire with ${cleanedSections.length} sections and ${totalQuestionsInserted} questions`);

    const insertErrors = []; // No errors with JSONB approach

    // Record upload with advanced analytics
    await supabase
      .from('file_uploads')
      .insert([{
        questionnaire_id: questionnaire.id,
        original_filename: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        uploaded_by: req.user.id,
        upload_status: 'completed',
        processing_result: {
          sections_created: sections.length,
          total_questions: allQuestions.length,
          average_confidence: avgConfidence.toFixed(3),
          question_types: allQuestions.reduce((acc, q) => {
            acc[q.question_type] = (acc[q.question_type] || 0) + 1;
            return acc;
          }, {}),
          parsing_metadata: extractedData.metadata
        }
      }]);

    res.status(201).json({
      success: true,
      message: 'File converted to questionnaire successfully',
      questionnaire: {
        id: questionnaire.id,
        title: questionnaire.title,
        sections_count: sections.length,
        questions_parsed: allQuestions.length,
        questions_saved: totalQuestionsInserted,
        average_confidence: avgConfidence.toFixed(3),
        hasErrors: insertErrors.length > 0,
        errors: insertErrors.length > 0 ? insertErrors : undefined
      },
      preview: sections.map(s => ({
        title: s.title.en,
        questions_count: s.questions?.length || 0,
        sample_questions: s.questions?.slice(0, 3).map(q => ({
          text: q.question_text.en,
          type: q.question_type,
          confidence: q.metadata?.confidence?.toFixed(2)
        }))
      }))
    });
  } catch (error) {
    console.error('File conversion error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to convert file to questionnaire',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================
// GET UPLOAD HISTORY
// ============================================

router.get('/uploads', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('file_uploads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Fetch uploads error:', error);
      return res.status(500).json({ error: 'Failed to fetch upload history' });
    }

    res.json(data);
  } catch (error) {
    console.error('Fetch uploads error:', error);
    res.status(500).json({ error: 'Failed to fetch upload history' });
  }
});

// ============================================
// TEST ENDPOINT - Verify Advanced Parser
// ============================================
router.get('/test-parser', async (req, res) => {
  try {
    // Simple test to verify advanced parser is loaded
    const testData = {
      text: '1. What is your name?\n2. What is your age?',
      html: '<p>1. What is your name?</p><p>2. What is your age?</p>',
      metadata: { wordCount: 10, characterCount: 50 }
    };

    const result = parseTextToQuestionnaireAdvanced(testData);

    res.json({
      success: true,
      message: 'Advanced parser is working!',
      parserVersion: '2.0',
      testResult: {
        sections: result.sections.length,
        questions: result.metadata.totalQuestions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Advanced parser test failed',
      details: error.message,
      stack: error.stack
    });
  }
});

// Export for testing
export { parseTextToQuestionnaire };

export default router;
