import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Submit questionnaire (public endpoint - no auth required)
router.post('/submit', async (req, res) => {
  try {
    const {
      country,
      contactName,
      contactEmail,
      completionStatus,
      responses,
      questionnaireId,
      language
    } = req.body;

    if (!country || !contactName || !contactEmail) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const { data, error } = await supabase
      .from('questionnaire_responses')
      .insert([
        {
          country,
          contact_name: contactName,
          contact_email: contactEmail,
          completion_status: completionStatus || 'Partial',
          responses: responses,
          questionnaire_id: questionnaireId || '00000000-0000-0000-0000-000000000001',
          language: language || 'en',
          submitted_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save response' });
    }

    res.status(201).json({
      success: true,
      message: 'Response submitted successfully',
      id: data.id
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Get all responses (requires admin auth)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch responses' });
    }

    res.json(data);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// Get single response (requires admin auth)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Response not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch response' });
  }
});

// Delete response (requires admin auth)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('questionnaire_responses')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete response' });
    }

    res.json({ success: true, message: 'Response deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete response' });
  }
});

export default router;
