/**
 * Check-in routes — daily check/uncheck for plans
 */
const express = require('express');
const pool    = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/checks?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns all check-ins for the current user's plans within date range.
 * Default: current month ± 1 month.
 */
router.get('/', async (req, res) => {
  try {
    let { from, to } = req.query;
    if (!from || !to) {
      const now = new Date();
      const y = now.getFullYear(), m = now.getMonth();
      // Previous month start → current month end
      const prevM = m === 0 ? 11 : m - 1;
      const prevY = m === 0 ? y - 1 : y;
      from = `${prevY}-${String(prevM + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      to = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }

    const [rows] = await pool.query(
      `SELECT c.plan_id, c.check_date, c.done
       FROM checks c
       JOIN plans p ON p.id = c.plan_id
       WHERE p.user_id = ? AND c.check_date BETWEEN ? AND ?
       ORDER BY c.check_date`,
      [req.user.id, from, to]
    );

    // Transform to { planId: { "YYYY-MM-DD": true/false } }
    const result = {};
    rows.forEach(r => {
      const pid = r.plan_id;
      const dk = r.check_date instanceof Date
        ? r.check_date.toISOString().slice(0, 10)
        : String(r.check_date).slice(0, 10);
      if (!result[pid]) result[pid] = {};
      result[pid][dk] = !!r.done;
    });

    res.json(result);
  } catch (err) {
    console.error('Get checks error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * PUT /api/checks
 * body: { planId, date, done }
 * Upsert a single check-in.
 */
router.put('/', async (req, res) => {
  try {
    const { planId, date, done } = req.body;
    if (planId === undefined || !date || done === undefined) {
      return res.status(400).json({ error: 'planId, date, and done required' });
    }

    // Verify ownership
    const [plans] = await pool.query(
      'SELECT id FROM plans WHERE id = ? AND user_id = ?',
      [planId, req.user.id]
    );
    if (plans.length === 0) {
      return res.status(404).json({ error: 'plan not found' });
    }

    await pool.query(
      `INSERT INTO checks (plan_id, check_date, done) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE done = VALUES(done)`,
      [planId, date, done ? 1 : 0]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Put check error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * PUT /api/checks/batch
 * body: { checks: [ { planId, date, done }, ... ] }
 * Batch upsert check-ins.
 */
router.put('/batch', async (req, res) => {
  try {
    const { checks } = req.body;
    if (!Array.isArray(checks) || checks.length === 0) {
      return res.status(400).json({ error: 'checks array required' });
    }

    // Verify all plans belong to user
    const planIds = [...new Set(checks.map(c => c.planId))];
    const [owned] = await pool.query(
      'SELECT id FROM plans WHERE user_id = ? AND id IN (?)',
      [req.user.id, planIds]
    );
    const ownedSet = new Set(owned.map(r => r.id));
    const invalid = planIds.filter(pid => !ownedSet.has(Number(pid)));
    if (invalid.length > 0) {
      return res.status(403).json({ error: 'some plans not owned by you' });
    }

    // Batch upsert
    const values = checks.map(c => [c.planId, c.date, c.done ? 1 : 0]);
    if (values.length > 0) {
      const placeholders = values.map(() => '(?, ?, ?)').join(', ');
      const flat = values.flat();
      await pool.query(
        `INSERT INTO checks (plan_id, check_date, done) VALUES ${placeholders}
         ON DUPLICATE KEY UPDATE done = VALUES(done)`,
        flat
      );
    }

    res.json({ ok: true, count: values.length });
  } catch (err) {
    console.error('Batch check error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
