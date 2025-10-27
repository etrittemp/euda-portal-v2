import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { ExcelExportService } from '../services/excelExport.js';

const router = express.Router();

// ============================================
// GET ALL QUESTIONNAIRES
// ============================================
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('questionnaires')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Fetch questionnaires error:', error);
      return res.status(500).json({ error: 'Failed to fetch questionnaires' });
    }

    res.json(data);
  } catch (error) {
    console.error('Fetch questionnaires error:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaires' });
  }
});

// ============================================
// GET SINGLE QUESTIONNAIRE WITH FULL DETAILS
// ============================================
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get questionnaire
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('id', id)
      .single();

    if (qError || !questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    // Get sections
    const { data: sections, error: sError } = await supabase
      .from('questionnaire_sections')
      .select('*')
      .eq('questionnaire_id', id)
      .order('order_index', { ascending: true });

    if (sError) {
      console.error('Fetch sections error:', sError);
      return res.status(500).json({ error: 'Failed to fetch sections' });
    }

    // Get all questions for this questionnaire
    const { data: questions, error: qsError } = await supabase
      .from('questions')
      .select('*')
      .eq('questionnaire_id', id)
      .order('order_index', { ascending: true });

    if (qsError) {
      console.error('Fetch questions error:', qsError);
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    // Organize questions by section
    const sectionsWithQuestions = sections.map(section => ({
      ...section,
      questions: questions.filter(q => q.section_id === section.id)
    }));

    res.json({
      ...questionnaire,
      sections: sectionsWithQuestions
    });
  } catch (error) {
    console.error('Fetch questionnaire error:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaire' });
  }
});

// ============================================
// VERIFY QUESTIONNAIRE CODE
// ============================================
router.get('/verify/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const { data: questionnaire, error } = await supabase
      .from('questionnaires')
      .select('id, password, status')
      .eq('id', code)
      .eq('status', 'active')
      .single();

    if (error || !questionnaire) {
      return res.json({ exists: false });
    }

    res.json({
      exists: true,
      requiresPassword: !!questionnaire.password
    });
  } catch (error) {
    console.error('Verify questionnaire error:', error);
    res.status(500).json({ error: 'Failed to verify questionnaire' });
  }
});

// ============================================
// VERIFY QUESTIONNAIRE PASSWORD
// ============================================
router.post('/verify-password', async (req, res) => {
  try {
    const { questionnaireId, password } = req.body;

    const { data: questionnaire, error } = await supabase
      .from('questionnaires')
      .select('password')
      .eq('id', questionnaireId)
      .eq('status', 'active')
      .single();

    if (error || !questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    // Simple password comparison (not hashed for simplicity)
    const valid = questionnaire.password === password;

    res.json({ valid });
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({ error: 'Failed to verify password' });
  }
});

// ============================================
// GET PUBLIC QUESTIONNAIRE (for respondents)
// ============================================
router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow active questionnaires
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (qError || !questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found or not active' });
    }

    // Get sections
    const { data: sections, error: sError } = await supabase
      .from('questionnaire_sections')
      .select('*')
      .eq('questionnaire_id', id)
      .order('order_index', { ascending: true });

    if (sError) {
      console.error('Fetch sections error:', sError);
      return res.status(500).json({ error: 'Failed to fetch sections' });
    }

    // Get questions
    const { data: questions, error: qsError } = await supabase
      .from('questions')
      .select('*')
      .eq('questionnaire_id', id)
      .order('order_index', { ascending: true });

    if (qsError) {
      console.error('Fetch questions error:', qsError);
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    // Organize questions by section
    const sectionsWithQuestions = sections.map(section => ({
      ...section,
      questions: questions.filter(q => q.section_id === section.id)
    }));

    res.json({
      ...questionnaire,
      sections: sectionsWithQuestions
    });
  } catch (error) {
    console.error('Fetch public questionnaire error:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaire' });
  }
});

// ============================================
// CREATE NEW QUESTIONNAIRE
// ============================================
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, status = 'draft', password, sections = [] } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Create questionnaire
    const questionnaireData = {
      title,
      description,
      status,
      created_by: req.user.id,
      published_at: status === 'active' ? new Date().toISOString() : null
    };

    // Only include password if it's provided and not empty
    if (password && password.trim()) {
      questionnaireData.password = password.trim();
    }

    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .insert([questionnaireData])
      .select()
      .single();

    if (qError) {
      console.error('Create questionnaire error:', qError);
      return res.status(500).json({ error: 'Failed to create questionnaire' });
    }

    // Create sections if provided
    if (sections.length > 0) {
      const sectionsData = sections.map((section, index) => ({
        questionnaire_id: questionnaire.id,
        title: section.title,
        description: section.description,
        order_index: section.order_index !== undefined ? section.order_index : index
      }));

      const { data: createdSections, error: sError } = await supabase
        .from('questionnaire_sections')
        .insert(sectionsData)
        .select();

      if (sError) {
        console.error('Create sections error:', sError);
        // Don't fail completely, just log the error
      }

      // Create questions if provided in sections
      for (const [sectionIndex, section] of sections.entries()) {
        if (section.questions && section.questions.length > 0 && createdSections) {
          const sectionId = createdSections[sectionIndex].id;

          const questionsData = section.questions.map((question, qIndex) => ({
            section_id: sectionId,
            questionnaire_id: questionnaire.id,
            question_text: question.question_text,
            question_type: question.question_type,
            options: question.options || null,
            required: question.required || false,
            order_index: question.order_index !== undefined ? question.order_index : qIndex,
            validation_rules: question.validation_rules || null,
            help_text: question.help_text || null
          }));

          const { error: qsError } = await supabase
            .from('questions')
            .insert(questionsData);

          if (qsError) {
            console.error('Create questions error:', qsError);
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Questionnaire created successfully',
      questionnaire
    });
  } catch (error) {
    console.error('Create questionnaire error:', error);
    res.status(500).json({ error: 'Failed to create questionnaire' });
  }
});

// ============================================
// UPDATE QUESTIONNAIRE
// ============================================
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, password, sections } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (password !== undefined) {
      // If password is empty string or null, set to null (remove password protection)
      // Otherwise, set the password value
      updates.password = password && password.trim() ? password.trim() : null;
    }
    if (status !== undefined) {
      updates.status = status;
      if (status === 'active') {
        updates.published_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('questionnaires')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update questionnaire error:', error);
      return res.status(500).json({ error: 'Failed to update questionnaire' });
    }

    // If sections are provided, update them
    if (sections && Array.isArray(sections)) {
      // Delete all existing sections and questions for this questionnaire
      await supabase
        .from('questions')
        .delete()
        .eq('questionnaire_id', id);

      await supabase
        .from('questionnaire_sections')
        .delete()
        .eq('questionnaire_id', id);

      // Create new sections
      if (sections.length > 0) {
        const sectionsData = sections.map((section, index) => {
          const sectionData = {
            questionnaire_id: id,
            title: section.title,
            description: section.description,
            order_index: section.order_index !== undefined ? section.order_index : index
          };

          // Only include ID if it's a valid UUID (not a temporary client-side ID)
          if (section.id &&
              typeof section.id === 'string' &&
              section.id.length > 0 &&
              !section.id.startsWith('section-') &&
              !section.id.startsWith('temp-')) {
            sectionData.id = section.id;
          }

          // Remove any undefined or null values from the object
          Object.keys(sectionData).forEach(key => {
            if (sectionData[key] === undefined || sectionData[key] === null) {
              delete sectionData[key];
            }
          });

          return sectionData;
        });

        // CRITICAL: Filter out any sections that somehow still have null/undefined id
        const cleanedSectionsData = sectionsData.filter(s => {
          if (s.id === null || s.id === undefined) {
            delete s.id; // Remove the id field entirely
          }
          return true; // Keep all sections, just cleaned
        });

        const { data: createdSections, error: sError } = await supabase
          .from('questionnaire_sections')
          .insert(cleanedSectionsData)
          .select();

        if (sError) {
          console.error('Create sections error:', sError);
          return res.status(500).json({ error: 'Failed to update sections' });
        }

        // Create questions
        for (const [sectionIndex, section] of sections.entries()) {
          if (section.questions && section.questions.length > 0 && createdSections) {
            const sectionId = createdSections[sectionIndex].id;

            const questionsData = section.questions.map((question, qIndex) => {
              const questionData = {
                section_id: sectionId,
                questionnaire_id: id,
                question_text: question.question_text,
                question_type: question.question_type,
                options: question.options || null,
                required: question.required || false,
                order_index: question.order_index !== undefined ? question.order_index : qIndex,
                validation_rules: question.validation_rules || null,
                help_text: question.help_text || null
              };

              // Only include ID if it's a valid UUID (not a temporary client-side ID)
              if (question.id &&
                  typeof question.id === 'string' &&
                  question.id.length > 0 &&
                  !question.id.startsWith('question-') &&
                  !question.id.startsWith('temp-')) {
                questionData.id = question.id;
              }

              // Remove any undefined or null values from the object
              Object.keys(questionData).forEach(key => {
                if (questionData[key] === undefined || questionData[key] === null) {
                  delete questionData[key];
                }
              });

              return questionData;
            });

            // CRITICAL: Filter out any questions that somehow still have null/undefined id
            const cleanedQuestionsData = questionsData.filter(q => {
              if (q.id === null || q.id === undefined) {
                delete q.id; // Remove the id field entirely
              }
              return true; // Keep all questions, just cleaned
            });

            const { error: qsError } = await supabase
              .from('questions')
              .insert(cleanedQuestionsData);

            if (qsError) {
              console.error('Create questions error:', qsError);
              return res.status(500).json({ error: 'Failed to update questions' });
            }
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Questionnaire updated successfully',
      questionnaire: data
    });
  } catch (error) {
    console.error('Update questionnaire error:', error);
    res.status(500).json({ error: 'Failed to update questionnaire' });
  }
});

// ============================================
// SAFE AUTOSAVE ENDPOINT - PATCH (doesn't delete anything)
// ============================================
router.patch('/:id/autosave', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, password, sections } = req.body;

    // Validate that we have data to save
    if (!title || !sections || !Array.isArray(sections)) {
      return res.status(400).json({ error: 'Invalid data: title and sections required' });
    }

    // Validate sections structure
    if (sections.length === 0) {
      return res.status(400).json({ error: 'Cannot save questionnaire with no sections' });
    }

    // Build update object
    const updates = {
      title,
      description: description || '',
      sections: sections, // Store as JSONB
      updated_at: new Date().toISOString()
    };

    // Only update password if explicitly provided
    if (password !== undefined) {
      updates.password = password && password.trim() ? password.trim() : null;
    }

    // Only update status if provided
    if (status !== undefined) {
      updates.status = status;
      if (status === 'active' && !updates.published_at) {
        updates.published_at = new Date().toISOString();
      }
    }

    // Perform the update - this ONLY updates the questionnaires table
    // NO DELETION happens here
    const { data, error } = await supabase
      .from('questionnaires')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Autosave error:', error);
      return res.status(500).json({ error: 'Failed to autosave questionnaire' });
    }

    res.json({
      success: true,
      message: 'Questionnaire autosaved successfully',
      questionnaire: data
    });
  } catch (error) {
    console.error('Autosave questionnaire error:', error);
    res.status(500).json({ error: 'Failed to autosave questionnaire' });
  }
});

// ============================================
// DELETE QUESTIONNAIRE
// ============================================
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    // Check if there are responses linked to this questionnaire
    const { data: responses, error: rError } = await supabase
      .from('questionnaire_responses')
      .select('id')
      .eq('questionnaire_id', id);

    if (rError) {
      console.error('Check responses error:', rError);
      return res.status(500).json({ error: 'Failed to check responses' });
    }

    const responseCount = responses?.length || 0;

    // If there are responses and force is not set, return the count for confirmation
    if (responseCount > 0 && force !== 'true') {
      return res.status(400).json({
        error: 'Questionnaire has responses',
        responseCount,
        requiresConfirmation: true
      });
    }

    // Delete all responses first if force is true
    if (responseCount > 0 && force === 'true') {
      const { error: deleteResponsesError } = await supabase
        .from('questionnaire_responses')
        .delete()
        .eq('questionnaire_id', id);

      if (deleteResponsesError) {
        console.error('Delete responses error:', deleteResponsesError);
        return res.status(500).json({ error: 'Failed to delete questionnaire responses' });
      }
    }

    // Delete questionnaire (cascade will delete sections and questions)
    const { error } = await supabase
      .from('questionnaires')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete questionnaire error:', error);
      return res.status(500).json({ error: 'Failed to delete questionnaire' });
    }

    res.json({
      success: true,
      message: 'Questionnaire deleted successfully',
      deletedResponses: responseCount
    });
  } catch (error) {
    console.error('Delete questionnaire error:', error);
    res.status(500).json({ error: 'Failed to delete questionnaire' });
  }
});

// ============================================
// GET QUESTIONNAIRE STATISTICS
// ============================================
router.get('/:id/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get response count and status breakdown
    const { data: responses, error } = await supabase
      .from('questionnaire_responses')
      .select('completion_status, submitted_at')
      .eq('questionnaire_id', id);

    if (error) {
      console.error('Fetch stats error:', error);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    const stats = {
      total_responses: responses.length,
      complete: responses.filter(r => r.completion_status === 'Complete').length,
      partial: responses.filter(r => r.completion_status === 'Partial').length,
      last_response: responses.length > 0
        ? new Date(Math.max(...responses.map(r => new Date(r.submitted_at)))).toISOString()
        : null
    };

    res.json(stats);
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ============================================
// DUPLICATE QUESTIONNAIRE
// ============================================
router.post('/:id/duplicate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    // Get original questionnaire with all details
    const { data: original, error: qError } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('id', id)
      .single();

    if (qError || !original) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    // Create new questionnaire
    const { data: newQuestionnaire, error: nqError } = await supabase
      .from('questionnaires')
      .insert([{
        title: title || `${original.title} (Copy)`,
        description: original.description,
        status: 'draft',
        created_by: req.user.id,
        version: 1
      }])
      .select()
      .single();

    if (nqError) {
      console.error('Duplicate questionnaire error:', nqError);
      return res.status(500).json({ error: 'Failed to duplicate questionnaire' });
    }

    // Get and duplicate sections
    const { data: sections, error: sError } = await supabase
      .from('questionnaire_sections')
      .select('*')
      .eq('questionnaire_id', id)
      .order('order_index', { ascending: true });

    if (sError) {
      console.error('Fetch sections error:', sError);
      return res.status(500).json({ error: 'Failed to fetch sections' });
    }

    if (sections && sections.length > 0) {
      const newSections = sections.map(s => ({
        questionnaire_id: newQuestionnaire.id,
        title: s.title,
        description: s.description,
        order_index: s.order_index
      }));

      const { data: createdSections, error: csError } = await supabase
        .from('questionnaire_sections')
        .insert(newSections)
        .select();

      if (csError) {
        console.error('Create sections error:', csError);
      }

      // Get and duplicate questions
      const { data: questions, error: qsError } = await supabase
        .from('questions')
        .select('*')
        .eq('questionnaire_id', id)
        .order('order_index', { ascending: true });

      if (qsError) {
        console.error('Fetch questions error:', qsError);
      }

      if (questions && questions.length > 0 && createdSections) {
        // Map old section IDs to new section IDs
        const sectionMap = {};
        sections.forEach((oldSection, index) => {
          sectionMap[oldSection.id] = createdSections[index].id;
        });

        const newQuestions = questions.map(q => ({
          section_id: sectionMap[q.section_id],
          questionnaire_id: newQuestionnaire.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          required: q.required,
          order_index: q.order_index,
          validation_rules: q.validation_rules,
          help_text: q.help_text
        }));

        const { error: cqError } = await supabase
          .from('questions')
          .insert(newQuestions);

        if (cqError) {
          console.error('Create questions error:', cqError);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Questionnaire duplicated successfully',
      questionnaire: newQuestionnaire
    });
  } catch (error) {
    console.error('Duplicate questionnaire error:', error);
    res.status(500).json({ error: 'Failed to duplicate questionnaire' });
  }
});

// ============================================
// GET QUESTIONNAIRE LIBRARY (for section/question selection)
// ============================================
router.get('/library/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get all questionnaires
    const { data: questionnaires, error: qError } = await supabase
      .from('questionnaires')
      .select('id, title, description, status, created_at')
      .order('created_at', { ascending: false });

    if (qError) {
      console.error('Fetch questionnaires error:', qError);
      return res.status(500).json({ error: 'Failed to fetch questionnaires' });
    }

    // Get all sections
    const { data: sections, error: sError } = await supabase
      .from('questionnaire_sections')
      .select('*')
      .order('order_index', { ascending: true });

    if (sError) {
      console.error('Fetch sections error:', sError);
      return res.status(500).json({ error: 'Failed to fetch sections' });
    }

    // Get all questions
    const { data: questions, error: qsError } = await supabase
      .from('questions')
      .select('*')
      .order('order_index', { ascending: true });

    if (qsError) {
      console.error('Fetch questions error:', qsError);
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    // Organize data into a tree structure
    const questionnairesWithData = questionnaires.map(questionnaire => {
      const questionnaireSections = sections.filter(s => s.questionnaire_id === questionnaire.id);

      const sectionsWithQuestions = questionnaireSections.map(section => ({
        ...section,
        questionCount: questions.filter(q => q.section_id === section.id).length,
        questions: questions.filter(q => q.section_id === section.id)
      }));

      return {
        ...questionnaire,
        sections: sectionsWithQuestions
      };
    });

    res.json({ questionnaires: questionnairesWithData });
  } catch (error) {
    console.error('Fetch library error:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaire library' });
  }
});

// ============================================
// CLONE SECTIONS/QUESTIONS (deep copy)
// ============================================
router.post('/clone-sections', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { targetQuestionnaireId, title, description, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items selected' });
    }

    let questionnaireId = targetQuestionnaireId;
    let isNewQuestionnaire = false;

    // Create new questionnaire if targetQuestionnaireId is null
    if (!targetQuestionnaireId) {
      if (!title) {
        return res.status(400).json({ error: 'Title is required for new questionnaire' });
      }

      const { data: newQuestionnaire, error: qError } = await supabase
        .from('questionnaires')
        .insert([{
          title,
          description: description || '',
          status: 'draft',
          created_by: req.user.id
        }])
        .select()
        .single();

      if (qError) {
        console.error('Create questionnaire error:', qError);
        return res.status(500).json({ error: 'Failed to create questionnaire' });
      }

      questionnaireId = newQuestionnaire.id;
      isNewQuestionnaire = true;
    }

    let sectionsAdded = 0;
    let questionsAdded = 0;
    const sectionIdMap = {}; // Map old section IDs to new ones

    // Process each item
    for (const item of items) {
      if (item.type === 'section') {
        // Clone entire section with all questions
        const { data: originalSection, error: sError } = await supabase
          .from('questionnaire_sections')
          .select('*')
          .eq('id', item.sectionId)
          .single();

        if (sError || !originalSection) {
          console.error('Fetch section error:', sError);
          continue;
        }

        // Create new section
        const { data: newSection, error: nsError } = await supabase
          .from('questionnaire_sections')
          .insert([{
            questionnaire_id: questionnaireId,
            title: originalSection.title,
            description: originalSection.description,
            order_index: sectionsAdded
          }])
          .select()
          .single();

        if (nsError) {
          console.error('Create section error:', nsError);
          continue;
        }

        sectionIdMap[item.sectionId] = newSection.id;
        sectionsAdded++;

        // Get all questions from original section
        const { data: originalQuestions, error: qError } = await supabase
          .from('questions')
          .select('*')
          .eq('section_id', item.sectionId)
          .order('order_index', { ascending: true });

        if (qError || !originalQuestions) {
          console.error('Fetch questions error:', qError);
          continue;
        }

        // Clone all questions
        if (originalQuestions.length > 0) {
          const newQuestions = originalQuestions.map((q, index) => ({
            section_id: newSection.id,
            questionnaire_id: questionnaireId,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options,
            required: q.required,
            order_index: index,
            validation_rules: q.validation_rules,
            help_text: q.help_text
          }));

          const { error: cqError } = await supabase
            .from('questions')
            .insert(newQuestions);

          if (cqError) {
            console.error('Create questions error:', cqError);
          } else {
            questionsAdded += newQuestions.length;
          }
        }
      } else if (item.type === 'question') {
        // Clone individual question
        const { data: originalQuestion, error: qError } = await supabase
          .from('questions')
          .select('*')
          .eq('id', item.questionId)
          .single();

        if (qError || !originalQuestion) {
          console.error('Fetch question error:', qError);
          continue;
        }

        // If we already have a mapped section for this question's section, use it
        // Otherwise, create a new section for orphaned questions
        let targetSectionId = sectionIdMap[item.sectionId];

        if (!targetSectionId) {
          // Get the original section info
          const { data: originalSection, error: sError } = await supabase
            .from('questionnaire_sections')
            .select('*')
            .eq('id', item.sectionId)
            .single();

          if (sError || !originalSection) {
            console.error('Fetch section for question error:', sError);
            continue;
          }

          // Create new section
          const { data: newSection, error: nsError } = await supabase
            .from('questionnaire_sections')
            .insert([{
              questionnaire_id: questionnaireId,
              title: originalSection.title,
              description: originalSection.description,
              order_index: sectionsAdded
            }])
            .select()
            .single();

          if (nsError) {
            console.error('Create section for question error:', nsError);
            continue;
          }

          targetSectionId = newSection.id;
          sectionIdMap[item.sectionId] = newSection.id;
          sectionsAdded++;
        }

        // Create new question
        const { error: cqError } = await supabase
          .from('questions')
          .insert([{
            section_id: targetSectionId,
            questionnaire_id: questionnaireId,
            question_text: originalQuestion.question_text,
            question_type: originalQuestion.question_type,
            options: originalQuestion.options,
            required: originalQuestion.required,
            order_index: questionsAdded,
            validation_rules: originalQuestion.validation_rules,
            help_text: originalQuestion.help_text
          }]);

        if (cqError) {
          console.error('Create question error:', cqError);
        } else {
          questionsAdded++;
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully cloned ${sectionsAdded} section(s) and ${questionsAdded} question(s)`,
      questionnaireId,
      sectionsAdded,
      questionsAdded,
      isNewQuestionnaire
    });
  } catch (error) {
    console.error('Clone sections error:', error);
    res.status(500).json({ error: 'Failed to clone sections' });
  }
});

// ============================================
// EXPORT QUESTIONNAIRE RESPONSES TO EXCEL
// ============================================
router.get('/:id/export/excel', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'en', format = 'xlsx' } = req.query;

    // Get questionnaire with full details
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('id', id)
      .single();

    if (qError || !questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    // Get sections
    const { data: sections, error: sError } = await supabase
      .from('questionnaire_sections')
      .select('*')
      .eq('questionnaire_id', id)
      .order('order_index', { ascending: true });

    if (sError) {
      console.error('Fetch sections error:', sError);
      return res.status(500).json({ error: 'Failed to fetch sections' });
    }

    // Get questions
    const { data: questions, error: qsError } = await supabase
      .from('questions')
      .select('*')
      .eq('questionnaire_id', id)
      .order('order_index', { ascending: true });

    if (qsError) {
      console.error('Fetch questions error:', qsError);
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    // Organize questions by section
    const sectionsWithQuestions = sections.map(section => ({
      ...section,
      questions: questions.filter(q => q.section_id === section.id)
    }));

    // Get responses
    const { data: responses, error: rError } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('questionnaire_id', id)
      .order('submitted_at', { ascending: false });

    if (rError) {
      console.error('Fetch responses error:', rError);
      return res.status(500).json({ error: 'Failed to fetch responses' });
    }

    // Build complete questionnaire object
    const completeQuestionnaire = {
      ...questionnaire,
      sections: sectionsWithQuestions
    };

    // Generate Excel workbook
    const excelService = new ExcelExportService();
    const workbook = await excelService.generateAdvancedExport(
      completeQuestionnaire,
      responses,
      { language }
    );

    // Set response headers
    const filename = `${questionnaire.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export to Excel error:', error);
    res.status(500).json({ error: 'Failed to export to Excel' });
  }
});

export default router;
