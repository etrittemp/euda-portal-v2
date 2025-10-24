import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/database.js';
import { authenticateToken, requireSuperuser } from '../middleware/auth.js';

const router = express.Router();

// Get all admin users (superuser only)
router.get('/users', authenticateToken, requireSuperuser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, name, role, is_active, created_at, last_login')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    res.json(data);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new admin user (superuser only)
router.post('/users', authenticateToken, requireSuperuser, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data, error } = await supabase
      .from('admin_users')
      .insert([
        {
          email: email.toLowerCase(),
          password_hash: passwordHash,
          name,
          role: role || 'admin',
          is_active: true
        }
      ])
      .select('id, email, name, role, is_active, created_at')
      .single();

    if (error) {
      console.error('Create user error:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      user: data
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update admin user (superuser only)
router.put('/users/:id', authenticateToken, requireSuperuser, async (req, res) => {
  try {
    const { name, role, is_active, password } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (role) updates.role = role;
    if (typeof is_active === 'boolean') updates.is_active = is_active;

    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, email, name, role, is_active')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update user' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: data
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete admin user (superuser only)
router.delete('/users/:id', authenticateToken, requireSuperuser, async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get statistics (admin and superuser)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { data: responses, error } = await supabase
      .from('questionnaire_responses')
      .select('completion_status, country');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    const stats = {
      total: responses.length,
      complete: responses.filter(r => r.completion_status === 'Complete').length,
      partial: responses.filter(r => r.completion_status === 'Partial').length,
      countries: new Set(responses.map(r => r.country)).size
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
