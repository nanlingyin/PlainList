/**
 * Plan routes — CRUD for tasks & habits
 */
const express = require('express');
const pool    = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/plans
 * Returns all plans for the current user
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, type, name, time, sort_order FROM plans WHERE user_id = ? ORDER BY time, sort_order',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * POST /api/plans
 * body: { name, type, time }
 */
router.post('/', async (req, res) => {
  try {
    if (req.user.isAdmin) {
      return res.status(403).json({ error: 'admin account is read-only' });
    }
    const { name, type, time } = req.body;
    if (!name || !type || !time) {
      return res.status(400).json({ error: 'name, type, and time required' });
    }
    if (!['habit', 'todo'].includes(type)) {
      return res.status(400).json({ error: 'type must be habit or todo' });
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ error: 'time must be HH:MM' });
    }

    const [result] = await pool.query(
      'INSERT INTO plans (user_id, type, name, time) VALUES (?, ?, ?, ?)',
      [req.user.id, type, name.trim(), time]
    );
    res.json({ id: result.insertId, type, name: name.trim(), time, sort_order: 0 });
  } catch (err) {
    console.error('Create plan error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * DELETE /api/plans/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.isAdmin) {
      return res.status(403).json({ error: 'admin account is read-only' });
    }
    const [result] = await pool.query(
      'DELETE FROM plans WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'plan not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete plan error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
