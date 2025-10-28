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

    // Get questionnaire with sections from JSONB column
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('id', id)
      .single();

    if (qError || !questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    // Sections are already in questionnaire.sections (JSONB column)
    // Ensure sections is an array (handle old data or null)
    if (!questionnaire.sections || !Array.isArray(questionnaire.sections)) {
      questionnaire.sections = [];
    }

    res.json(questionnaire);
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

    // Only allow active questionnaires - sections from JSONB column
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (qError || !questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found or not active' });
    }

    // Sections are already in questionnaire.sections (JSONB column)
    // Ensure sections is an array
    if (!questionnaire.sections || !Array.isArray(questionnaire.sections)) {
      questionnaire.sections = [];
    }

    res.json(questionnaire);
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

    // Create questionnaire with sections as JSONB
    const questionnaireData = {
      title,
      description,
      status,
      sections: sections, // Store sections as JSONB directly
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

    // Build update object
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

    // Store sections as JSONB (no more separate tables)
    if (sections !== undefined) {
      updates.sections = sections;
    }

    updates.updated_at = new Date().toISOString();

    // Single update operation - no DELETEs, no separate table operations
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

    // Get original questionnaire with sections from JSONB
    const { data: original, error: qError } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('id', id)
      .single();

    if (qError || !original) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    // Generate new IDs for sections and questions to avoid conflicts
    const duplicatedSections = (original.sections || []).map(section => ({
      ...section,
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      questions: (section.questions || []).map(question => ({
        ...question,
        id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    }));

    // Create new questionnaire with duplicated sections as JSONB
    const { data: newQuestionnaire, error: nqError } = await supabase
      .from('questionnaires')
      .insert([{
        title: title || `${original.title} (Copy)`,
        description: original.description,
        status: 'draft',
        sections: duplicatedSections,
        created_by: req.user.id,
        version: 1
      }])
      .select()
      .single();

    if (nqError) {
      console.error('Duplicate questionnaire error:', nqError);
      return res.status(500).json({ error: 'Failed to duplicate questionnaire' });
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
    // Get all questionnaires with sections from JSONB
    const { data: questionnaires, error: qError } = await supabase
      .from('questionnaires')
      .select('*')
      .order('created_at', { ascending: false });

    if (qError) {
      console.error('Fetch questionnaires error:', qError);
      return res.status(500).json({ error: 'Failed to fetch questionnaires' });
    }

    // Format data for library view with question counts
    const questionnairesWithData = questionnaires.map(questionnaire => {
      const sections = (questionnaire.sections || []).map(section => ({
        ...section,
        questionCount: (section.questions || []).length,
        questionnaire_id: questionnaire.id // Add for compatibility
      }));

      return {
        id: questionnaire.id,
        title: questionnaire.title,
        description: questionnaire.description,
        status: questionnaire.status,
        created_at: questionnaire.created_at,
        sections: sections
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
    let targetSections = [];

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
          sections: [], // Initialize with empty sections
          created_by: req.user.id
        }])
        .select()
        .single();

      if (qError) {
        console.error('[CLONE-SECTIONS] Create questionnaire error:', qError);
        return res.status(500).json({
          error: 'Failed to create questionnaire',
          details: qError.message,
          code: qError.code,
          hint: qError.hint
        });
      }

      questionnaireId = newQuestionnaire.id;
      isNewQuestionnaire = true;
      targetSections = [];
    } else {
      // Get existing questionnaire and its sections
      const { data: existingQuestionnaire, error: eqError } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('id', targetQuestionnaireId)
        .single();

      if (eqError || !existingQuestionnaire) {
        return res.status(404).json({ error: 'Target questionnaire not found' });
      }

      targetSections = existingQuestionnaire.sections || [];
    }

    let sectionsAdded = 0;
    let questionsAdded = 0;
    const sectionIdMap = {}; // Map old section IDs to new cloned section data

    // Collect all unique source questionnaire IDs
    const sourceQuestionnaireIds = [...new Set(items.map(item => item.sourceQuestionnaireId))];

    // Fetch all source questionnaires at once
    const { data: sourceQuestionnaires, error: sqError } = await supabase
      .from('questionnaires')
      .select('*')
      .in('id', sourceQuestionnaireIds);

    if (sqError) {
      console.error('[CLONE-SECTIONS] Fetch source questionnaires error:', sqError);
      return res.status(500).json({
        error: 'Failed to fetch source questionnaires',
        details: sqError.message,
        code: sqError.code,
        hint: sqError.hint
      });
    }

    // Create a map for quick lookup
    const questionnaireMap = {};
    sourceQuestionnaires.forEach(q => {
      questionnaireMap[q.id] = q.sections || [];
    });

    // Process each item
    for (const item of items) {
      const sourceSections = questionnaireMap[item.sourceQuestionnaireId] || [];

      if (item.type === 'section') {
        // Find and clone entire section with all questions
        const originalSection = sourceSections.find(s => s.id === item.sectionId);

        if (!originalSection) {
          console.error('Section not found:', item.sectionId);
          continue;
        }

        // Create cloned section with new IDs
        const clonedSection = {
          ...originalSection,
          id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          order_index: targetSections.length,
          questions: (originalSection.questions || []).map(q => ({
            ...q,
            id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }))
        };

        targetSections.push(clonedSection);
        sectionIdMap[item.sectionId] = clonedSection;
        sectionsAdded++;
        questionsAdded += clonedSection.questions.length;

      } else if (item.type === 'question') {
        // Find and clone individual question
        let originalQuestion = null;
        let originalSection = null;

        for (const section of sourceSections) {
          const found = (section.questions || []).find(q => q.id === item.questionId);
          if (found) {
            originalQuestion = found;
            originalSection = section;
            break;
          }
        }

        if (!originalQuestion || !originalSection) {
          console.error('Question not found:', item.questionId);
          continue;
        }

        // Check if we already created a section for this source section
        let targetSection = sectionIdMap[item.sectionId];

        if (!targetSection) {
          // Create new section for orphaned questions
          targetSection = {
            id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: originalSection.title,
            description: originalSection.description,
            order_index: targetSections.length,
            questions: []
          };
          targetSections.push(targetSection);
          sectionIdMap[item.sectionId] = targetSection;
          sectionsAdded++;
        }

        // Clone question with new ID
        const clonedQuestion = {
          ...originalQuestion,
          id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          order_index: targetSection.questions.length
        };

        targetSection.questions.push(clonedQuestion);
        questionsAdded++;
      }
    }

    // Update target questionnaire with new sections
    const { error: updateError } = await supabase
      .from('questionnaires')
      .update({
        sections: targetSections,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionnaireId);

    if (updateError) {
      console.error('[CLONE-SECTIONS] Update questionnaire error:', updateError);
      console.error('[CLONE-SECTIONS] Sections being saved:', JSON.stringify(targetSections, null, 2).substring(0, 500));
      return res.status(500).json({
        error: 'Failed to update questionnaire',
        details: updateError.message,
        code: updateError.code,
        hint: updateError.hint
      });
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
    console.error('[CLONE-SECTIONS] Unexpected error:', error);
    res.status(500).json({
      error: 'Failed to clone sections',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================
// EXPORT QUESTIONNAIRE RESPONSES TO EXCEL
// ============================================
router.get('/:id/export/excel', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'en', format = 'xlsx' } = req.query;

    // Get questionnaire with sections from JSONB
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('id', id)
      .single();

    if (qError || !questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    // Sections are already in questionnaire.sections (JSONB)
    // Ensure sections is an array
    if (!questionnaire.sections || !Array.isArray(questionnaire.sections)) {
      questionnaire.sections = [];
    }

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

    // Generate Excel workbook
    const excelService = new ExcelExportService();
    const workbook = await excelService.generateAdvancedExport(
      questionnaire,
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
