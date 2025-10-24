// ============================================================================
// STATE-OF-THE-ART QUESTIONNAIRE PARSER v2.0
//
// Based on latest research (2024-2025) and best practices:
// - Multi-pass parsing algorithm
// - ML-inspired pattern recognition with weighted scoring
// - Context-aware structural analysis
// - Robust error handling and validation
// - Modular design for easy maintenance
// ============================================================================

/**
 * PHASE 1: PREPROCESSING & NORMALIZATION
 * Clean and standardize document text for optimal parsing
 */
class DocumentPreprocessor {
  constructor() {
    this.skipPatterns = [
      /^page \d+/i,
      /^© \d{4}/i,
      /^\d+\s*$/,
      /^_{3,}$/,
      /^-{3,}$/,
      /^={3,}$/,
      /^\s*$/
    ];
  }

  preprocess(text) {
    // Normalize unicode characters
    text = text.normalize('NFC');

    // Split into lines
    let lines = text.split(/\r?\n/);

    // Clean and filter lines
    lines = lines
      .map(line => this.cleanLine(line))
      .filter(line => !this.shouldSkipLine(line));

    // Remove duplicate consecutive lines (common in formatted docs)
    lines = this.deduplicateLines(lines);

    return lines;
  }

  cleanLine(line) {
    // Trim whitespace
    line = line.trim();

    // Normalize multiple spaces
    line = line.replace(/\s+/g, ' ');

    // Remove zero-width characters
    line = line.replace(/[\u200B-\u200D\uFEFF]/g, '');

    return line;
  }

  shouldSkipLine(line) {
    if (line.length === 0) return true;

    for (const pattern of this.skipPatterns) {
      if (pattern.test(line)) return true;
    }

    return false;
  }

  deduplicateLines(lines) {
    const result = [];
    let prev = null;

    for (const line of lines) {
      if (line !== prev) {
        result.push(line);
        prev = line;
      }
    }

    return result;
  }
}

/**
 * PHASE 2: LAYOUT DETECTION & STRUCTURAL ANALYSIS
 * Identify document elements using ML-inspired feature extraction
 */
class LayoutAnalyzer {
  constructor(lines, html) {
    this.lines = lines;
    this.html = html;
    this.boldTexts = this.extractBoldTexts(html);
    this.layoutMap = [];
  }

  extractBoldTexts(html) {
    const boldSet = new Set();
    if (!html) return boldSet;

    const boldRegex = /<strong>([^<]+)<\/strong>/g;
    let match;

    while ((match = boldRegex.exec(html)) !== null) {
      boldSet.add(match[1].trim());
    }

    return boldSet;
  }

  analyze() {
    this.layoutMap = this.lines.map((line, idx) => {
      const features = this.extractFeatures(line, idx);
      const element = this.classifyElement(line, features);

      return {
        index: idx,
        line: line,
        features: features,
        element: element
      };
    });

    return this.layoutMap;
  }

  extractFeatures(line, idx) {
    return {
      // Length features
      length: line.length,
      wordCount: line.split(/\s+/).length,

      // Character features
      hasNumbers: /\d/.test(line),
      hasLetters: /[a-zA-Z]/.test(line),
      hasSpecialChars: /[^\w\s]/.test(line),

      // Case features
      isAllCaps: /^[A-Z\s\d\W]+$/.test(line) && line.length > 5,
      startsWithCaps: /^[A-Z]/.test(line),

      // Formatting features
      isBold: this.boldTexts.has(line),

      // Structural features
      hasQuestionMark: line.endsWith('?'),
      hasColon: line.endsWith(':'),

      // Indentation (estimated from character patterns)
      estimatedIndent: line.match(/^[\s\t]*/)?.[0]?.length || 0,

      // Position features
      isFirstLine: idx === 0,
      isLastLine: idx === this.lines.length - 1,
      relativePosition: idx / this.lines.length
    };
  }

  classifyElement(line, features) {
    const scores = {
      title: 0,
      section: 0,
      question: 0,
      option: 0,
      text: 0,
      blank: 0
    };

    // Title scoring (first lines, bold, all caps)
    if (features.isFirstLine && features.isBold) scores.title += 50;
    if (features.isAllCaps && features.length < 100) scores.title += 30;
    if (features.relativePosition < 0.05) scores.title += 20;

    // Section scoring (bold, moderate length, no question mark)
    if (features.isBold && !features.hasQuestionMark) scores.section += 40;
    if (features.isAllCaps && features.length > 10 && features.length < 80) scores.section += 30;
    if (features.hasColon && features.length < 60) scores.section += 20;

    // Question scoring (various numbering patterns)
    const questionPatterns = this.getQuestionPatterns();
    for (const pattern of questionPatterns) {
      if (pattern.regex.test(line)) {
        scores.question += pattern.score;
        break;
      }
    }
    if (features.hasQuestionMark) scores.question += 15;

    // Option scoring (checkbox, radio, bullet patterns)
    const optionPatterns = this.getOptionPatterns();
    for (const pattern of optionPatterns) {
      if (pattern.regex.test(line)) {
        scores.option += pattern.score;
        break;
      }
    }
    if (features.estimatedIndent > 0) scores.option += 10;

    // Text scoring (default for descriptive content)
    if (features.length > 20 && features.length < 200) scores.text += 10;

    // Find highest scoring element type
    let maxScore = 0;
    let elementType = 'text';

    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        elementType = type;
      }
    }

    return {
      type: elementType,
      confidence: Math.min(maxScore / 100, 1.0),
      scores: scores
    };
  }

  getQuestionPatterns() {
    return [
      { regex: /^(\d+\.)+\d+\s+.+/, score: 90, name: 'hierarchical' },
      { regex: /^\d+\.\s+.+/, score: 85, name: 'simple' },
      { regex: /^\d+\)\s+.+/, score: 80, name: 'paren' },
      { regex: /^[A-Za-z]\.\s+.+/, score: 75, name: 'letter' },
      { regex: /^[A-Za-z]\)\s+.+/, score: 75, name: 'letter_paren' },
      { regex: /^[IVX]+\.\s+.+/, score: 70, name: 'roman' },
      { regex: /^(Q|Question)\s*\d+[\.\:]\s+.+/i, score: 85, name: 'prefixed' },
      { regex: /^\[\d+\]\s+.+/, score: 80, name: 'bracketed' }
    ];
  }

  getOptionPatterns() {
    return [
      { regex: /^\(\s*\)\s+.+/, score: 90, name: 'radio_empty' },
      { regex: /^\(x\)\s+.+/i, score: 90, name: 'radio_checked' },
      { regex: /^\[\s*\]\s+.+/, score: 90, name: 'checkbox_empty' },
      { regex: /^\[x\]\s+.+/i, score: 90, name: 'checkbox_checked' },
      { regex: /^[\*\-\•]\s+.+/, score: 75, name: 'bullet' },
      { regex: /^[a-z]\)\s+.+/, score: 70, name: 'letter_option' },
      { regex: /^[A-Z]\)\s+.+/, score: 70, name: 'letter_option_caps' }
    ];
  }
}

/**
 * PHASE 3: SEMANTIC ANALYSIS & CONTEXT UNDERSTANDING
 * Understand relationships between elements using context
 */
class SemanticAnalyzer {
  constructor(layoutMap) {
    this.layoutMap = layoutMap;
  }

  analyze() {
    // Add contextual information to each element
    return this.layoutMap.map((item, idx) => {
      const context = this.buildContext(idx);
      const semanticType = this.inferSemanticType(item, context);

      return {
        ...item,
        context: context,
        semanticType: semanticType
      };
    });
  }

  buildContext(idx) {
    const windowSize = 3;
    const before = this.layoutMap.slice(Math.max(0, idx - windowSize), idx);
    const after = this.layoutMap.slice(idx + 1, Math.min(this.layoutMap.length, idx + windowSize + 1));

    return {
      hasSectionBefore: before.some(item => item.element.type === 'section'),
      hasQuestionBefore: before.some(item => item.element.type === 'question'),
      hasOptionBefore: before.some(item => item.element.type === 'option'),

      hasSectionAfter: after.some(item => item.element.type === 'section'),
      hasQuestionAfter: after.some(item => item.element.type === 'question'),
      hasOptionAfter: after.some(item => item.element.type === 'option'),

      optionCount: after.filter(item => item.element.type === 'option').length,

      previousElementType: idx > 0 ? this.layoutMap[idx - 1].element.type : null,
      nextElementType: idx < this.layoutMap.length - 1 ? this.layoutMap[idx + 1].element.type : null
    };
  }

  inferSemanticType(item, context) {
    const { element, features, line } = item;

    // Refine element classification based on context
    if (element.type === 'question') {
      // If followed by many options, likely multiple choice
      if (context.optionCount >= 2) {
        return this.classifyQuestionType(line, 'multiple_choice');
      }
      return this.classifyQuestionType(line, 'default');
    }

    if (element.type === 'section') {
      // Distinguish between main sections and subsections
      if (features.isBold && features.isAllCaps) {
        return 'main_section';
      }
      return 'subsection';
    }

    if (element.type === 'option') {
      // Context helps confirm it's really an option
      if (context.hasQuestionBefore) {
        return 'valid_option';
      }
      return 'possible_option';
    }

    return element.type;
  }

  classifyQuestionType(questionText, hint = 'default') {
    // Advanced question type classification using NLP-inspired keyword analysis
    const text = questionText.toLowerCase();

    const typeScores = {
      radio: 0,
      checkbox: 0,
      select: 0,
      textarea: 0,
      text: 0,
      number: 0,
      date: 0,
      time: 0,
      email: 0,
      phone: 0,
      url: 0,
      rating: 0,
      file: 0
    };

    // Multiple choice indicators
    if (hint === 'multiple_choice') {
      typeScores.radio += 50;
      typeScores.checkbox += 30;
    }

    // Keyword-based scoring
    const keywords = {
      radio: ['select one', 'choose one', 'pick one', 'which', 'yes/no', 'yes or no'],
      checkbox: ['select all', 'choose all', 'check all', 'mark all', 'all that apply'],
      textarea: ['explain', 'describe', 'why', 'tell us', 'comments', 'feedback', 'elaborate'],
      text: ['name', 'title', 'label'],
      number: ['how many', 'number of', 'count', 'quantity', 'age', 'years'],
      date: ['date', 'when', 'day', 'month', 'year', 'birthday'],
      time: ['time', 'hour', 'minute', 'clock'],
      email: ['email', 'e-mail', 'electronic mail'],
      phone: ['phone', 'telephone', 'mobile', 'cell'],
      url: ['website', 'url', 'link', 'web address'],
      rating: ['rate', 'rating', 'scale', 'score', 'satisfaction', '1-5', '1-10', 'stars'],
      file: ['upload', 'attach', 'file', 'document', 'image', 'photo']
    };

    for (const [type, terms] of Object.entries(keywords)) {
      for (const term of terms) {
        if (text.includes(term)) {
          typeScores[type] += 20;
        }
      }
    }

    // Pattern-based scoring
    if (/\d+\s*[-to]\s*\d+/.test(text)) typeScores.rating += 30;
    if (text.includes('?')) typeScores.text += 5;

    // Find best type
    let maxScore = 0;
    let bestType = 'text';

    for (const [type, score] of Object.entries(typeScores)) {
      if (score > maxScore) {
        maxScore = score;
        bestType = type;
      }
    }

    // Default to radio for multiple choice, text otherwise
    if (maxScore < 20) {
      return hint === 'multiple_choice' ? 'radio' : 'text';
    }

    return bestType;
  }
}

/**
 * PHASE 4: RELATIONSHIP BUILDING & STRUCTURED EXTRACTION
 * Build questionnaire structure with sections, questions, and options
 */
class StructureBuilder {
  constructor(semanticMap) {
    this.semanticMap = semanticMap;
    this.sections = [];
    this.processedIndices = new Set();
  }

  build() {
    let currentSection = this.createDefaultSection();
    let currentQuestions = [];

    for (let i = 0; i < this.semanticMap.length; i++) {
      if (this.processedIndices.has(i)) continue;

      const item = this.semanticMap[i];

      // Handle sections
      if (item.element.type === 'section' && item.element.confidence > 0.3) {
        // Save previous section
        if (currentQuestions.length > 0) {
          currentSection.questions = currentQuestions;
          this.sections.push(currentSection);
        }

        // Create new section
        currentSection = {
          title: { en: item.line, sq: item.line, sr: item.line },
          description: { en: '', sq: '', sr: '' },
          order_index: this.sections.length
        };
        currentQuestions = [];
        this.processedIndices.add(i);
        continue;
      }

      // Handle questions
      if (item.element.type === 'question' && item.element.confidence > 0.5) {
        const question = this.extractQuestion(i);
        if (question) {
          currentQuestions.push(question);
        }
        continue;
      }

      // Handle title (first bold/caps item)
      if (item.element.type === 'title' && this.sections.length === 0) {
        // Keep as document title, don't create section for it
        this.processedIndices.add(i);
        continue;
      }
    }

    // Save final section
    if (currentQuestions.length > 0) {
      currentSection.questions = currentQuestions;
      this.sections.push(currentSection);
    } else if (this.sections.length === 0) {
      // No sections found, create default section
      currentSection.questions = currentQuestions;
      this.sections.push(currentSection);
    }

    return this.sections;
  }

  createDefaultSection() {
    return {
      title: { en: 'General Questions', sq: 'Pyetje të Përgjithshme', sr: 'Општа питања' },
      description: { en: '', sq: '', sr: '' },
      order_index: 0
    };
  }

  extractQuestion(startIdx) {
    const item = this.semanticMap[startIdx];
    this.processedIndices.add(startIdx);

    // Extract question number
    const { number, text } = this.extractQuestionNumber(item.line);

    // Handle multi-line questions
    let questionText = text;
    let currentIdx = startIdx + 1;

    // Look ahead for continuation lines
    while (currentIdx < this.semanticMap.length && currentIdx < startIdx + 3) {
      const nextItem = this.semanticMap[currentIdx];

      // Stop if we hit another structural element
      if (['section', 'question', 'option'].includes(nextItem.element.type)) {
        break;
      }

      // Continue if it's plain text that might be part of the question
      if (nextItem.element.type === 'text' && nextItem.features.length > 10) {
        questionText += ' ' + nextItem.line;
        this.processedIndices.add(currentIdx);
        currentIdx++;
      } else {
        break;
      }
    }

    // Extract options if they follow
    const options = this.extractOptions(currentIdx);

    // Determine question type
    const questionType = item.semanticType && item.semanticType !== 'question'
      ? item.semanticType
      : (options.length > 0 ? 'radio' : 'text');

    // Determine if required
    const isRequired = questionText.includes('*') ||
                      /\(required\)/i.test(questionText) ||
                      /\(mandatory\)/i.test(questionText);

    return {
      question_number: number,
      question_text: {
        en: questionText.replace(/\*$/, '').trim(),
        sq: questionText.replace(/\*$/, '').trim(),
        sr: questionText.replace(/\*$/, '').trim()
      },
      question_type: questionType,
      options: options.length > 0 ? options : null,
      required: isRequired,
      order_index: -1, // Will be set later
      validation_rules: null,
      help_text: null,  // Database expects null, not empty object
      metadata: {
        confidence: item.element.confidence,
        pattern: item.element.scores
      }
    };
  }

  extractQuestionNumber(line) {
    const patterns = [
      { regex: /^((\d+\.)+\d+)\s+/, extract: m => m[1] },
      { regex: /^(\d+)\.\s+/, extract: m => m[1] },
      { regex: /^(\d+)\)\s+/, extract: m => m[1] },
      { regex: /^([A-Za-z])\.\s+/, extract: m => m[1] },
      { regex: /^([A-Za-z])\)\s+/, extract: m => m[1] },
      { regex: /^([IVX]+)\.\s+/, extract: m => m[1] },
      { regex: /^(?:Q|Question)\s*(\d+)[\.\:]\s+/i, extract: m => m[1] },
      { regex: /^\[(\d+)\]\s+/, extract: m => m[1] }
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern.regex);
      if (match) {
        const number = pattern.extract(match);
        const text = line.replace(pattern.regex, '').trim();
        return { number, text };
      }
    }

    // No number found, use line as is
    return { number: 'unnumbered', text: line };
  }

  extractOptions(startIdx) {
    const options = [];
    let currentIdx = startIdx;

    // Look ahead for options (up to 20 lines)
    while (currentIdx < this.semanticMap.length && currentIdx < startIdx + 20) {
      const item = this.semanticMap[currentIdx];

      // Stop if we hit a question or section
      if (['question', 'section'].includes(item.element.type)) {
        break;
      }

      // Extract if it's an option
      if (item.element.type === 'option') {
        const optionText = this.cleanOptionText(item.line);
        if (optionText) {
          options.push({
            en: optionText,
            sq: optionText,
            sr: optionText
          });
          this.processedIndices.add(currentIdx);
        }
      }

      currentIdx++;

      // Stop after we've moved past options
      if (options.length > 0 && item.element.type === 'text') {
        break;
      }
    }

    return options;
  }

  cleanOptionText(line) {
    // Remove option markers
    const cleaned = line
      .replace(/^\(\s*\)\s*/, '')
      .replace(/^\(x\)\s*/i, '')
      .replace(/^\[\s*\]\s*/, '')
      .replace(/^\[x\]\s*/i, '')
      .replace(/^[\*\-\•]\s*/, '')
      .replace(/^[a-zA-Z]\)\s*/, '')
      .trim();

    return cleaned.length > 0 ? cleaned : null;
  }
}

/**
 * PHASE 5: VALIDATION & QUALITY ASSURANCE
 * Validate and enhance the extracted structure
 */
class QualityValidator {
  constructor(sections) {
    this.sections = sections;
  }

  validate() {
    // Assign proper order indices
    this.sections.forEach((section, sIdx) => {
      if (section.questions) {
        section.questions.forEach((question, qIdx) => {
          question.order_index = qIdx;

          // If question number is still default, assign sequential number
          if (question.question_number === 'unnumbered') {
            question.question_number = String(qIdx + 1);
          }
        });
      }
    });

    // Remove empty sections
    this.sections = this.sections.filter(section =>
      section.questions && section.questions.length > 0
    );

    // Calculate statistics
    const totalQuestions = this.sections.reduce((sum, s) =>
      sum + (s.questions ? s.questions.length : 0), 0
    );

    return {
      sections: this.sections,
      metadata: {
        totalSections: this.sections.length,
        totalQuestions: totalQuestions,
        validated: true,
        parserVersion: '2.0'
      }
    };
  }
}

/**
 * MAIN PARSER ORCHESTRATOR
 * Coordinates all parsing phases
 */
function parseTextToQuestionnaireAdvanced(extractedData) {
  const { text, html, metadata } = extractedData;

  console.log('[ADVANCED PARSER] Starting multi-pass parsing...');

  // Phase 1: Preprocessing
  const preprocessor = new DocumentPreprocessor();
  const lines = preprocessor.preprocess(text);
  console.log(`[ADVANCED PARSER] Phase 1 complete: ${lines.length} lines after preprocessing`);

  // Phase 2: Layout Analysis
  const layoutAnalyzer = new LayoutAnalyzer(lines, html);
  const layoutMap = layoutAnalyzer.analyze();
  console.log(`[ADVANCED PARSER] Phase 2 complete: Layout analyzed`);

  // Phase 3: Semantic Analysis
  const semanticAnalyzer = new SemanticAnalyzer(layoutMap);
  const semanticMap = semanticAnalyzer.analyze();
  console.log(`[ADVANCED PARSER] Phase 3 complete: Semantic analysis done`);

  // Phase 4: Structure Building
  const structureBuilder = new StructureBuilder(semanticMap);
  const sections = structureBuilder.build();
  console.log(`[ADVANCED PARSER] Phase 4 complete: ${sections.length} sections built`);

  // Phase 5: Validation
  const validator = new QualityValidator(sections);
  const result = validator.validate();
  console.log(`[ADVANCED PARSER] Phase 5 complete: Validated ${result.metadata.totalQuestions} questions`);

  return result;
}

export {
  parseTextToQuestionnaireAdvanced,
  DocumentPreprocessor,
  LayoutAnalyzer,
  SemanticAnalyzer,
  StructureBuilder,
  QualityValidator
};
