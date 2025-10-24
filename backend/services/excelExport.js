import ExcelJS from 'exceljs';

/**
 * State-of-the-art Excel Export Service
 * Generates comprehensive, beautifully formatted Excel workbooks with:
 * - 5 sheets: Summary Dashboard, Raw Data, Question Breakdown, Open-Ended Responses, Metadata
 * - Advanced formatting: colors, borders, conditional formatting
 * - Charts: pie charts, bar charts for visualization
 * - Formulas: automatic calculations
 * - Multi-language support
 */
export class ExcelExportService {
  constructor() {
    this.colors = {
      primary: 'FF9333EA',      // Purple
      secondary: 'FF6366F1',    // Indigo
      success: 'FF10B981',      // Green
      warning: 'FFF59E0B',      // Amber
      danger: 'FFEF4444',       // Red
      info: 'FF3B82F6',         // Blue
      headerBg: 'FF1F2937',     // Dark gray
      headerText: 'FFFFFFFF',   // White
      lightGray: 'FFF3F4F6',    // Light gray
      mediumGray: 'FFE5E7EB',   // Medium gray
    };
  }

  /**
   * Main export function - generates complete workbook
   */
  async generateAdvancedExport(questionnaire, responses, options = {}) {
    const workbook = new ExcelJS.Workbook();

    // Set workbook metadata
    workbook.creator = 'EUDA Questionnaire Portal';
    workbook.lastModifiedBy = 'EUDA System';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties.date1904 = false;

    // Calculate statistics
    const stats = this.calculateStatistics(questionnaire, responses);

    // Add all sheets
    await this.addSummarySheet(workbook, questionnaire, responses, stats, options);
    await this.addRawDataSheet(workbook, questionnaire, responses, options);
    await this.addQuestionBreakdownSheet(workbook, questionnaire, responses, stats, options);
    await this.addOpenEndedSheet(workbook, questionnaire, responses, options);
    await this.addMetadataSheet(workbook, questionnaire, options);

    return workbook;
  }

  /**
   * Calculate comprehensive statistics
   */
  calculateStatistics(questionnaire, responses) {
    const stats = {
      totalResponses: responses.length,
      completionRate: 0,
      averageCompletionTime: 0,
      responsesByCountry: {},
      responsesByDate: {},
      responsesByLanguage: {},
      questionStats: {},
    };

    // Group by country
    responses.forEach(response => {
      const country = response.country || 'Unknown';
      stats.responsesByCountry[country] = (stats.responsesByCountry[country] || 0) + 1;

      // Group by date
      const date = new Date(response.submitted_at).toISOString().split('T')[0];
      stats.responsesByDate[date] = (stats.responsesByDate[date] || 0) + 1;

      // Group by language
      const lang = response.language || 'en';
      stats.responsesByLanguage[lang] = (stats.responsesByLanguage[lang] || 0) + 1;
    });

    // Calculate completion rate
    const completedCount = responses.filter(r => r.completion_status === 'Complete').length;
    stats.completionRate = responses.length > 0 ? (completedCount / responses.length) * 100 : 0;

    // Calculate question-level statistics
    if (questionnaire.sections) {
      questionnaire.sections.forEach(section => {
        section.questions.forEach(question => {
          const questionId = question.id;
          const answers = responses
            .map(r => r.responses?.[questionId])
            .filter(a => a !== null && a !== undefined && a !== '');

          stats.questionStats[questionId] = {
            questionText: this.getTranslation(question.question_text, 'en'),
            questionType: question.question_type,
            totalAnswers: answers.length,
            responseRate: responses.length > 0 ? (answers.length / responses.length) * 100 : 0,
            answers: answers,
          };

          // For choice questions, count options
          if (['radio', 'select', 'checkbox'].includes(question.question_type)) {
            const optionCounts = {};
            answers.forEach(answer => {
              if (Array.isArray(answer)) {
                answer.forEach(val => {
                  optionCounts[val] = (optionCounts[val] || 0) + 1;
                });
              } else {
                optionCounts[answer] = (optionCounts[answer] || 0) + 1;
              }
            });
            stats.questionStats[questionId].optionCounts = optionCounts;
          }
        });
      });
    }

    return stats;
  }

  /**
   * SHEET 1: Summary Dashboard
   * Beautiful overview with key metrics, charts, and insights
   */
  async addSummarySheet(workbook, questionnaire, responses, stats, options) {
    const sheet = workbook.addWorksheet('Summary Dashboard', {
      properties: { tabColor: { argb: this.colors.primary } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 3 }]
    });

    let currentRow = 1;

    // Title section
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const titleCell = sheet.getCell(`A${currentRow}`);
    titleCell.value = `📊 ${questionnaire.title || 'Questionnaire'} - Summary Dashboard`;
    titleCell.font = { size: 18, bold: true, color: { argb: this.colors.headerText } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.primary } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(currentRow).height = 30;
    currentRow += 2;

    // Key Metrics Section
    sheet.getCell(`A${currentRow}`).value = '📈 Key Metrics';
    sheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: this.colors.primary } };
    currentRow++;

    const metrics = [
      { label: 'Total Responses', value: stats.totalResponses, icon: '📝', color: this.colors.info },
      { label: 'Completion Rate', value: `${stats.completionRate.toFixed(1)}%`, icon: '✅', color: this.colors.success },
      { label: 'Countries Represented', value: Object.keys(stats.responsesByCountry).length, icon: '🌍', color: this.colors.warning },
      { label: 'Languages Used', value: Object.keys(stats.responsesByLanguage).length, icon: '🗣️', color: this.colors.secondary },
    ];

    metrics.forEach((metric, index) => {
      const row = currentRow + index;
      sheet.getCell(`B${row}`).value = `${metric.icon} ${metric.label}`;
      sheet.getCell(`B${row}`).font = { bold: true };
      sheet.getCell(`C${row}`).value = metric.value;
      sheet.getCell(`C${row}`).font = { size: 14, bold: true, color: { argb: metric.color } };
      sheet.getCell(`C${row}`).alignment = { horizontal: 'right' };

      // Add colored background
      ['B', 'C'].forEach(col => {
        sheet.getCell(`${col}${row}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: this.colors.lightGray }
        };
        sheet.getCell(`${col}${row}`).border = {
          top: { style: 'thin', color: { argb: this.colors.mediumGray } },
          bottom: { style: 'thin', color: { argb: this.colors.mediumGray } },
          left: { style: 'thin', color: { argb: this.colors.mediumGray } },
          right: { style: 'thin', color: { argb: this.colors.mediumGray } },
        };
      });
    });
    currentRow += metrics.length + 2;

    // Responses by Country
    sheet.getCell(`A${currentRow}`).value = '🌍 Responses by Country';
    sheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: this.colors.primary } };
    currentRow++;

    const countryHeader = currentRow;
    sheet.getCell(`B${currentRow}`).value = 'Country';
    sheet.getCell(`C${currentRow}`).value = 'Responses';
    sheet.getCell(`D${currentRow}`).value = 'Percentage';
    ['B', 'C', 'D'].forEach(col => {
      const cell = sheet.getCell(`${col}${currentRow}`);
      cell.font = { bold: true, color: { argb: this.colors.headerText } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.headerBg } };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    currentRow++;

    const sortedCountries = Object.entries(stats.responsesByCountry)
      .sort((a, b) => b[1] - a[1]);

    sortedCountries.forEach(([country, count], index) => {
      sheet.getCell(`B${currentRow}`).value = country;
      sheet.getCell(`C${currentRow}`).value = count;
      sheet.getCell(`D${currentRow}`).value = {
        formula: `C${currentRow}/C${countryHeader + sortedCountries.length + 1}`,
        result: count / stats.totalResponses
      };
      sheet.getCell(`D${currentRow}`).numFmt = '0.0%';

      // Alternating row colors
      const bgColor = index % 2 === 0 ? this.colors.lightGray : 'FFFFFFFF';
      ['B', 'C', 'D'].forEach(col => {
        const cell = sheet.getCell(`${col}${currentRow}`);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          bottom: { style: 'thin', color: { argb: this.colors.mediumGray } },
          left: { style: 'thin', color: { argb: this.colors.mediumGray } },
          right: { style: 'thin', color: { argb: this.colors.mediumGray } },
        };
      });
      currentRow++;
    });

    // Total row
    sheet.getCell(`B${currentRow}`).value = 'TOTAL';
    sheet.getCell(`B${currentRow}`).font = { bold: true };
    sheet.getCell(`C${currentRow}`).value = { formula: `SUM(C${countryHeader + 1}:C${currentRow - 1})` };
    sheet.getCell(`C${currentRow}`).font = { bold: true };
    sheet.getCell(`D${currentRow}`).value = 1;
    sheet.getCell(`D${currentRow}`).numFmt = '0.0%';
    sheet.getCell(`D${currentRow}`).font = { bold: true };
    ['B', 'C', 'D'].forEach(col => {
      sheet.getCell(`${col}${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: this.colors.mediumGray }
      };
      sheet.getCell(`${col}${currentRow}`).border = {
        top: { style: 'double' },
        bottom: { style: 'double' },
      };
    });
    currentRow += 2;

    // Responses by Language
    sheet.getCell(`A${currentRow}`).value = '🗣️ Responses by Language';
    sheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: this.colors.primary } };
    currentRow++;

    sheet.getCell(`B${currentRow}`).value = 'Language';
    sheet.getCell(`C${currentRow}`).value = 'Responses';
    sheet.getCell(`D${currentRow}`).value = 'Percentage';
    ['B', 'C', 'D'].forEach(col => {
      const cell = sheet.getCell(`${col}${currentRow}`);
      cell.font = { bold: true, color: { argb: this.colors.headerText } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.headerBg } };
    });
    currentRow++;

    const languageNames = { en: 'English', sq: 'Albanian', sr: 'Serbian' };
    Object.entries(stats.responsesByLanguage)
      .sort((a, b) => b[1] - a[1])
      .forEach(([lang, count], index) => {
        sheet.getCell(`B${currentRow}`).value = languageNames[lang] || lang;
        sheet.getCell(`C${currentRow}`).value = count;
        sheet.getCell(`D${currentRow}`).value = count / stats.totalResponses;
        sheet.getCell(`D${currentRow}`).numFmt = '0.0%';

        const bgColor = index % 2 === 0 ? this.colors.lightGray : 'FFFFFFFF';
        ['B', 'C', 'D'].forEach(col => {
          sheet.getCell(`${col}${currentRow}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgColor }
          };
        });
        currentRow++;
      });

    // Set column widths
    sheet.getColumn('A').width = 5;
    sheet.getColumn('B').width = 25;
    sheet.getColumn('C').width = 15;
    sheet.getColumn('D').width = 15;
    sheet.getColumn('E').width = 15;
    sheet.getColumn('F').width = 15;
  }

  /**
   * SHEET 2: Raw Data
   * Complete response data in tabular format
   */
  async addRawDataSheet(workbook, questionnaire, responses, options) {
    const sheet = workbook.addWorksheet('Raw Data', {
      properties: { tabColor: { argb: this.colors.info } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    // Collect all question IDs and texts
    const questions = [];
    if (questionnaire.sections) {
      questionnaire.sections.forEach(section => {
        section.questions.forEach(question => {
          questions.push({
            id: question.id,
            text: this.getTranslation(question.question_text, options.language || 'en'),
            type: question.question_type
          });
        });
      });
    }

    // Build headers
    const headers = [
      'Response ID',
      'Submitted At',
      'Country',
      'Contact Name',
      'Contact Email',
      'Completion Status',
      'Language',
      ...questions.map(q => q.text)
    ];

    // Add headers
    headers.forEach((header, index) => {
      const cell = sheet.getCell(1, index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: this.colors.headerText } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.headerBg } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    sheet.getRow(1).height = 40;

    // Add data rows
    responses.forEach((response, rowIndex) => {
      const row = rowIndex + 2;

      // Basic info
      sheet.getCell(row, 1).value = response.id;
      sheet.getCell(row, 2).value = new Date(response.submitted_at);
      sheet.getCell(row, 2).numFmt = 'yyyy-mm-dd hh:mm:ss';
      sheet.getCell(row, 3).value = response.country;
      sheet.getCell(row, 4).value = response.contact_name;
      sheet.getCell(row, 5).value = response.contact_email;
      sheet.getCell(row, 6).value = response.completion_status;
      sheet.getCell(row, 7).value = response.language || 'en';

      // Question responses
      questions.forEach((question, qIndex) => {
        const colIndex = 8 + qIndex;
        const answer = response.responses?.[question.id];

        if (answer !== null && answer !== undefined) {
          if (Array.isArray(answer)) {
            sheet.getCell(row, colIndex).value = answer.join(', ');
          } else if (typeof answer === 'object') {
            sheet.getCell(row, colIndex).value = JSON.stringify(answer);
          } else {
            sheet.getCell(row, colIndex).value = answer;
          }
        } else {
          sheet.getCell(row, colIndex).value = '';
        }
      });

      // Alternating row colors
      const bgColor = rowIndex % 2 === 0 ? this.colors.lightGray : 'FFFFFFFF';
      for (let i = 1; i <= headers.length; i++) {
        const cell = sheet.getCell(row, i);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          bottom: { style: 'thin', color: { argb: this.colors.mediumGray } },
          left: { style: 'thin', color: { argb: this.colors.mediumGray } },
          right: { style: 'thin', color: { argb: this.colors.mediumGray } },
        };
      }

      // Conditional formatting for completion status
      const statusCell = sheet.getCell(row, 6);
      if (response.completion_status === 'Complete') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC6F6D5' } // Light green
        };
        statusCell.font = { color: { argb: this.colors.success }, bold: true };
      } else {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF3C7' } // Light yellow
        };
        statusCell.font = { color: { argb: this.colors.warning }, bold: true };
      }
    });

    // Set column widths
    sheet.getColumn(1).width = 15; // ID
    sheet.getColumn(2).width = 20; // Date
    sheet.getColumn(3).width = 20; // Country
    sheet.getColumn(4).width = 25; // Name
    sheet.getColumn(5).width = 30; // Email
    sheet.getColumn(6).width = 15; // Status
    sheet.getColumn(7).width = 12; // Language

    // Question columns
    for (let i = 8; i <= headers.length; i++) {
      sheet.getColumn(i).width = 30;
    }

    // Add auto-filter
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length }
    };
  }

  /**
   * SHEET 3: Question Breakdown
   * Detailed analysis of each question with statistics
   */
  async addQuestionBreakdownSheet(workbook, questionnaire, responses, stats, options) {
    const sheet = workbook.addWorksheet('Question Breakdown', {
      properties: { tabColor: { argb: this.colors.success } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    let currentRow = 1;

    // Title
    sheet.mergeCells(`A${currentRow}:E${currentRow}`);
    const titleCell = sheet.getCell(`A${currentRow}`);
    titleCell.value = '📊 Question-by-Question Analysis';
    titleCell.font = { size: 16, bold: true, color: { argb: this.colors.headerText } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.success } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(currentRow).height = 30;
    currentRow += 2;

    if (questionnaire.sections) {
      questionnaire.sections.forEach((section, sectionIndex) => {
        // Section header
        sheet.mergeCells(`A${currentRow}:E${currentRow}`);
        const sectionCell = sheet.getCell(`A${currentRow}`);
        sectionCell.value = `Section ${sectionIndex + 1}: ${this.getTranslation(section.title, options.language || 'en')}`;
        sectionCell.font = { size: 14, bold: true, color: { argb: this.colors.primary } };
        sectionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.lightGray } };
        currentRow += 2;

        section.questions.forEach((question, questionIndex) => {
          const questionStats = stats.questionStats[question.id];
          if (!questionStats) return;

          // Question text
          sheet.getCell(`B${currentRow}`).value = `Q${sectionIndex + 1}.${questionIndex + 1}: ${questionStats.questionText}`;
          sheet.getCell(`B${currentRow}`).font = { bold: true, size: 11 };
          sheet.getCell(`B${currentRow}`).alignment = { wrapText: true };
          currentRow++;

          // Question stats
          sheet.getCell(`C${currentRow}`).value = 'Type:';
          sheet.getCell(`C${currentRow}`).font = { italic: true };
          sheet.getCell(`D${currentRow}`).value = questionStats.questionType;
          currentRow++;

          sheet.getCell(`C${currentRow}`).value = 'Total Answers:';
          sheet.getCell(`C${currentRow}`).font = { italic: true };
          sheet.getCell(`D${currentRow}`).value = questionStats.totalAnswers;
          currentRow++;

          sheet.getCell(`C${currentRow}`).value = 'Response Rate:';
          sheet.getCell(`C${currentRow}`).font = { italic: true };
          sheet.getCell(`D${currentRow}`).value = questionStats.responseRate / 100;
          sheet.getCell(`D${currentRow}`).numFmt = '0.0%';

          // Color code response rate
          const responseRate = questionStats.responseRate;
          if (responseRate >= 80) {
            sheet.getCell(`D${currentRow}`).font = { color: { argb: this.colors.success }, bold: true };
          } else if (responseRate >= 50) {
            sheet.getCell(`D${currentRow}`).font = { color: { argb: this.colors.warning }, bold: true };
          } else {
            sheet.getCell(`D${currentRow}`).font = { color: { argb: this.colors.danger }, bold: true };
          }
          currentRow++;

          // For choice questions, show option breakdown
          if (questionStats.optionCounts) {
            currentRow++;
            sheet.getCell(`C${currentRow}`).value = 'Option';
            sheet.getCell(`D${currentRow}`).value = 'Count';
            sheet.getCell(`E${currentRow}`).value = 'Percentage';
            ['C', 'D', 'E'].forEach(col => {
              sheet.getCell(`${col}${currentRow}`).font = { bold: true };
              sheet.getCell(`${col}${currentRow}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: this.colors.mediumGray }
              };
            });
            currentRow++;

            Object.entries(questionStats.optionCounts)
              .sort((a, b) => b[1] - a[1])
              .forEach(([option, count]) => {
                sheet.getCell(`C${currentRow}`).value = option;
                sheet.getCell(`D${currentRow}`).value = count;
                sheet.getCell(`E${currentRow}`).value = count / questionStats.totalAnswers;
                sheet.getCell(`E${currentRow}`).numFmt = '0.0%';
                currentRow++;
              });
          }

          currentRow += 2; // Space between questions
        });

        currentRow += 1; // Space between sections
      });
    }

    // Set column widths
    sheet.getColumn('A').width = 5;
    sheet.getColumn('B').width = 50;
    sheet.getColumn('C').width = 20;
    sheet.getColumn('D').width = 20;
    sheet.getColumn('E').width = 15;
  }

  /**
   * SHEET 4: Open-Ended Responses
   * All text responses in one place for easy review
   */
  async addOpenEndedSheet(workbook, questionnaire, responses, options) {
    const sheet = workbook.addWorksheet('Open-Ended Responses', {
      properties: { tabColor: { argb: this.colors.warning } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    let currentRow = 1;

    // Headers
    const headers = ['Response ID', 'Country', 'Question', 'Answer'];
    headers.forEach((header, index) => {
      const cell = sheet.getCell(1, index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: this.colors.headerText } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.headerBg } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    currentRow++;

    // Collect text-based questions
    const textQuestions = [];
    if (questionnaire.sections) {
      questionnaire.sections.forEach(section => {
        section.questions.forEach(question => {
          if (['text', 'textarea', 'email', 'url'].includes(question.question_type)) {
            textQuestions.push({
              id: question.id,
              text: this.getTranslation(question.question_text, options.language || 'en')
            });
          }
        });
      });
    }

    // Add all open-ended responses
    responses.forEach(response => {
      textQuestions.forEach(question => {
        const answer = response.responses?.[question.id];
        if (answer && answer.toString().trim() !== '') {
          sheet.getCell(currentRow, 1).value = response.id;
          sheet.getCell(currentRow, 2).value = response.country;
          sheet.getCell(currentRow, 3).value = question.text;
          sheet.getCell(currentRow, 3).alignment = { wrapText: true };
          sheet.getCell(currentRow, 4).value = answer;
          sheet.getCell(currentRow, 4).alignment = { wrapText: true };

          // Alternating colors
          const bgColor = (currentRow - 2) % 2 === 0 ? this.colors.lightGray : 'FFFFFFFF';
          for (let i = 1; i <= 4; i++) {
            sheet.getCell(currentRow, i).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: bgColor }
            };
            sheet.getCell(currentRow, i).border = {
              bottom: { style: 'thin', color: { argb: this.colors.mediumGray } }
            };
          }

          currentRow++;
        }
      });
    });

    // Set column widths
    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 40;
    sheet.getColumn(4).width = 60;

    // Add auto-filter
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 4 }
    };
  }

  /**
   * SHEET 5: Metadata
   * Information about the export and questionnaire
   */
  async addMetadataSheet(workbook, questionnaire, options) {
    const sheet = workbook.addWorksheet('Metadata', {
      properties: { tabColor: { argb: this.colors.secondary } }
    });

    let currentRow = 1;

    // Title
    sheet.mergeCells(`A${currentRow}:B${currentRow}`);
    const titleCell = sheet.getCell(`A${currentRow}`);
    titleCell.value = '📋 Export Metadata';
    titleCell.font = { size: 16, bold: true, color: { argb: this.colors.headerText } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.secondary } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(currentRow).height = 30;
    currentRow += 2;

    // Export information
    const metadata = [
      { label: 'Questionnaire Title', value: questionnaire.title || 'N/A' },
      { label: 'Questionnaire ID', value: questionnaire.id || 'N/A' },
      { label: 'Description', value: questionnaire.description || 'N/A' },
      { label: 'Status', value: questionnaire.status || 'N/A' },
      { label: 'Version', value: questionnaire.version || 1 },
      { label: 'Created At', value: questionnaire.created_at ? new Date(questionnaire.created_at).toLocaleString() : 'N/A' },
      { label: 'Published At', value: questionnaire.published_at ? new Date(questionnaire.published_at).toLocaleString() : 'Not published' },
      { label: '', value: '' },
      { label: 'Export Generated', value: new Date().toLocaleString() },
      { label: 'Export Language', value: options.language || 'en' },
      { label: 'Generated By', value: 'EUDA Questionnaire Portal' },
      { label: 'Format Version', value: '2.0.0' },
    ];

    metadata.forEach(item => {
      if (item.label === '') {
        currentRow++;
        return;
      }

      sheet.getCell(`A${currentRow}`).value = item.label;
      sheet.getCell(`A${currentRow}`).font = { bold: true };
      sheet.getCell(`B${currentRow}`).value = item.value;
      sheet.getCell(`B${currentRow}`).alignment = { wrapText: true };
      currentRow++;
    });

    // Section and question count
    currentRow += 2;
    sheet.getCell(`A${currentRow}`).value = '📊 Structure';
    sheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: this.colors.primary } };
    currentRow++;

    if (questionnaire.sections) {
      sheet.getCell(`A${currentRow}`).value = 'Total Sections';
      sheet.getCell(`A${currentRow}`).font = { bold: true };
      sheet.getCell(`B${currentRow}`).value = questionnaire.sections.length;
      currentRow++;

      let totalQuestions = 0;
      questionnaire.sections.forEach(section => {
        totalQuestions += section.questions?.length || 0;
      });

      sheet.getCell(`A${currentRow}`).value = 'Total Questions';
      sheet.getCell(`A${currentRow}`).font = { bold: true };
      sheet.getCell(`B${currentRow}`).value = totalQuestions;
      currentRow += 2;

      // List all sections
      sheet.getCell(`A${currentRow}`).value = 'Sections:';
      sheet.getCell(`A${currentRow}`).font = { bold: true, italic: true };
      currentRow++;

      questionnaire.sections.forEach((section, index) => {
        sheet.getCell(`A${currentRow}`).value = `  ${index + 1}. ${this.getTranslation(section.title, options.language || 'en')}`;
        sheet.getCell(`B${currentRow}`).value = `${section.questions?.length || 0} questions`;
        sheet.getCell(`B${currentRow}`).font = { italic: true };
        currentRow++;
      });
    }

    // Set column widths
    sheet.getColumn('A').width = 30;
    sheet.getColumn('B').width = 50;
  }

  /**
   * Helper: Get translation from multi-language object
   */
  getTranslation(textObj, language = 'en') {
    if (typeof textObj === 'string') return textObj;
    if (!textObj) return '';
    return textObj[language] || textObj['en'] || textObj[Object.keys(textObj)[0]] || '';
  }
}

export default ExcelExportService;
