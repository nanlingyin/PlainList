/**
 * Auth routes — register, login, list accounts
 */
const express = require('express');
const bcrypt  = require('bcryptjs');
const pool    = require('../db');
const { signToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * body: { username, password }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }
    const name = username.toLowerCase().trim();
    if (!/^[a-zA-Z0-9_\-\.]{2,20}$/.test(name)) {
      return res.status(400).json({ error: '2–20 chars, letters/numbers/_/-/. only' });
    }
    if (password.length < 3) {
      return res.status(400).json({ error: 'at least 3 characters' });
    }

    // Check duplicate
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [name]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'name already taken' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [name, hash]
    );

    const token = signToken({ id: result.insertId, username: name, is_admin: 0 });
    res.json({ token, username: name, isAdmin: false });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * POST /api/auth/login
 * body: { username, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }
    const name = username.toLowerCase().trim();

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [name]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'account not found' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'incorrect passphrase' });
    }

    const token = signToken(user);
    res.json({ token, username: user.username, isAdmin: !!user.is_admin });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * GET /api/auth/accounts
 * Returns list of usernames (public — for account picker)
 */
router.get('/accounts', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT username, is_admin FROM users ORDER BY created_at');
    res.json(rows.map(r => ({ username: r.username, isAdmin: !!r.is_admin })));
  } catch (err) {
    console.error('List accounts error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * GET /api/auth/me
 * Returns current user info (requires auth)
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json({ username: req.user.username, isAdmin: req.user.isAdmin });
});

module.exports = router;
