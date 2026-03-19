/**
 * Plugin routes — install, uninstall, list, serve plugin files
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const pool    = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router     = express.Router();
const PLUGINS_DIR = path.resolve(__dirname, '../plugins');
const REGISTRY_PATH = path.join(PLUGINS_DIR, 'registry.json');

/** Read installed plugins for a user from DB */
async function getInstalled(userId) {
  const [rows] = await pool.query(
    "SELECT value FROM user_settings WHERE user_id = ? AND key_name = 'installed_plugins'",
    [userId]
  );
  if (rows.length === 0) return [];
  try { return JSON.parse(rows[0].value); } catch { return []; }
}

/** Write installed plugins list back to DB */
async function setInstalled(userId, list) {
  await pool.query(
    `INSERT INTO user_settings (user_id, key_name, value) VALUES (?, 'installed_plugins', ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [userId, JSON.stringify(list)]
  );
}

/**
 * GET /api/plugins/available
 * Returns the full plugin registry (public metadata, no auth required)
 */
router.get('/available', (_req, res) => {
  try {
    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    res.json(registry);
  } catch {
    res.json([]);
  }
});

/**
 * GET /api/plugins/installed
 * Returns current user's installed plugin list
 */
router.get('/installed', authMiddleware, async (req, res) => {
  try {
    res.json(await getInstalled(req.user.id));
  } catch (err) {
    console.error('Get installed plugins error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * POST /api/plugins/install
 * body: { pluginId }
 */
router.post('/install', authMiddleware, async (req, res) => {
  try {
    const { pluginId } = req.body;
    if (!pluginId || !/^[a-z0-9-]+$/.test(pluginId)) {
      return res.status(400).json({ error: 'invalid pluginId' });
    }

    // Verify plugin exists in registry
    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    const meta = registry.find(p => p.id === pluginId);
    if (!meta) return res.status(404).json({ error: 'plugin not found' });

    const list = await getInstalled(req.user.id);
    if (list.find(p => p.id === pluginId)) {
      return res.json({ ok: true, alreadyInstalled: true });
    }

    list.push({ id: pluginId, enabled: true, installedAt: new Date().toISOString() });
    await setInstalled(req.user.id, list);
    res.json({ ok: true });
  } catch (err) {
    console.error('Install plugin error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * DELETE /api/plugins/uninstall/:id
 */
router.delete('/uninstall/:id', authMiddleware, async (req, res) => {
  try {
    const pluginId = req.params.id;
    if (!/^[a-z0-9-]+$/.test(pluginId)) {
      return res.status(400).json({ error: 'invalid pluginId' });
    }

    const list = await getInstalled(req.user.id);
    const next = list.filter(p => p.id !== pluginId);
    await setInstalled(req.user.id, next);
    res.json({ ok: true });
  } catch (err) {
    console.error('Uninstall plugin error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * GET /api/plugins/file/:id
 * Serves the plugin JS file — requires auth, strict path validation
 */
router.get('/file/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  if (!/^[a-z0-9-]+$/.test(id)) return res.status(400).end();

  const filePath = path.resolve(PLUGINS_DIR, id + '.js');
  // Prevent path traversal
  if (!filePath.startsWith(PLUGINS_DIR + path.sep) && filePath !== PLUGINS_DIR) {
    return res.status(403).end();
  }

  if (!fs.existsSync(filePath)) return res.status(404).end();

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.sendFile(filePath);
});

/**
 * GET /api/plugins/active-theme
 * Returns the current user's active theme id
 */
router.get('/active-theme', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT value FROM user_settings WHERE user_id = ? AND key_name = 'active_theme'",
      [req.user.id]
    );
    res.json({ themeId: rows.length > 0 ? rows[0].value : 'default' });
  } catch (err) {
    console.error('Get active theme error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * POST /api/plugins/active-theme
 * body: { themeId }
 */
router.post('/active-theme', authMiddleware, async (req, res) => {
  try {
    const { themeId } = req.body;
    if (!themeId || !/^[a-z0-9-]+$/.test(themeId)) {
      return res.status(400).json({ error: 'invalid themeId' });
    }
    await pool.query(
      `INSERT INTO user_settings (user_id, key_name, value) VALUES (?, 'active_theme', ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [req.user.id, themeId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Set active theme error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
