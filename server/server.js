/**
 * PlainList Server — Express + MySQL
 */
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const bcrypt   = require('bcryptjs');
const pool     = require('./db');

const authRoutes    = require('./routes/auth');
const plansRoutes   = require('./routes/plans');
const checksRoutes  = require('./routes/checks');
const pluginsRoutes = require('./routes/plugins');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ─── Middleware ──────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ─── Serve frontend (index.html in parent directory) ────── */
app.use(express.static(path.join(__dirname, '..')));

/* ─── API routes ─────────────────────────────────────────── */
app.use('/api/auth',    authRoutes);
app.use('/api/plans',   plansRoutes);
app.use('/api/checks',  checksRoutes);
app.use('/api/plugins', pluginsRoutes);

/* ─── Database initialisation ────────────────────────────── */
async function initDB() {
  const conn = await pool.getConnection();
  try {
    // Create tables if they don't exist
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        username   VARCHAR(20)  NOT NULL UNIQUE,
        password   VARCHAR(255) NOT NULL,
        is_admin   TINYINT(1)   NOT NULL DEFAULT 0,
        created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id    INT UNSIGNED    NOT NULL,
        type       ENUM('habit','todo') NOT NULL DEFAULT 'habit',
        name       VARCHAR(200)    NOT NULL,
        time       CHAR(5)         NOT NULL DEFAULT '09:00',
        sort_order INT             NOT NULL DEFAULT 0,
        created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_plans_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS checks (
        id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        plan_id    BIGINT UNSIGNED NOT NULL,
        check_date DATE            NOT NULL,
        done       TINYINT(1)      NOT NULL DEFAULT 0,
        FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
        UNIQUE KEY uk_plan_date (plan_id, check_date),
        INDEX idx_checks_date (check_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id    INT UNSIGNED    NOT NULL,
        key_name   VARCHAR(100)    NOT NULL,
        value      TEXT            NOT NULL,
        updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uk_user_key (user_id, key_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Seed admin account if not exists
    const [admins] = await conn.query("SELECT id FROM users WHERE username = 'admin'");
    if (admins.length === 0) {
      const hash = await bcrypt.hash('admin', 10);
      const [userResult] = await conn.query(
        "INSERT INTO users (username, password, is_admin) VALUES ('admin', ?, 1)",
        [hash]
      );
      const adminId = userResult.insertId;

      // Seed admin plans
      const adminPlans = [
        ['habit', 'Morning stretching',   '06:30'],
        ['habit', 'Read 30 min',          '07:00'],
        ['habit', 'Cold shower',          '07:30'],
        ['todo',  'Review email backlog', '09:00'],
        ['todo',  'Design system tokens', '10:00'],
        ['todo',  'Write weekly report',  '11:00'],
        ['habit', 'Lunch walk (20 min)',  '12:30'],
        ['todo',  'Frontend PR review',   '14:00'],
        ['todo',  'Team sync call',       '15:30'],
        ['habit', 'No phone after 21:00', '21:00'],
        ['habit', 'Journal entry',        '22:00'],
        ['todo',  "Prep tomorrow's tasks",'22:30'],
      ];

      for (const [type, name, time] of adminPlans) {
        const [planResult] = await conn.query(
          'INSERT INTO plans (user_id, type, name, time) VALUES (?, ?, ?, ?)',
          [adminId, type, name, time]
        );

        // Seed random historical check-in data
        const today = new Date();
        const planId = planResult.insertId;
        const checks = [];

        // Current month (up to yesterday)
        for (let d = 1; d < today.getDate(); d++) {
          const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const done = Math.random() > (type === 'habit' ? 0.22 : 0.28) ? 1 : 0;
          checks.push([planId, date, done]);
        }

        // Previous month
        const pm = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
        const py = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
        const daysInPrevMonth = new Date(py, pm + 1, 0).getDate();
        for (let d = 1; d <= daysInPrevMonth; d++) {
          const date = `${py}-${String(pm + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const done = Math.random() > 0.22 ? 1 : 0;
          checks.push([planId, date, done]);
        }

        // Today's initial state
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const todayDone = ['Morning stretching', 'Read 30 min', 'Review email backlog',
                           'Design system tokens', 'Lunch walk (20 min)', 'Team sync call'].includes(name) ? 1 : 0;
        checks.push([planId, todayStr, todayDone]);

        // Batch insert checks
        if (checks.length > 0) {
          const placeholders = checks.map(() => '(?, ?, ?)').join(', ');
          await conn.query(
            `INSERT INTO checks (plan_id, check_date, done) VALUES ${placeholders}
             ON DUPLICATE KEY UPDATE done = VALUES(done)`,
            checks.flat()
          );
        }
      }
      console.log('✓ Admin account seeded with demo data');
    }

    console.log('✓ Database tables ready');
  } finally {
    conn.release();
  }
}

/* ─── Start ──────────────────────────────────────────────── */
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n  PlainList server running at http://localhost:${PORT}\n`);
    });
  })
  .catch(err => {
    console.error('Failed to initialise database:', err.message);
    console.error('\nMake sure MySQL is running and the database config in .env is correct.');
    console.error('You can create the database manually:\n  mysql -u root -e "CREATE DATABASE plainlist; CREATE USER \'plainlist\'@\'localhost\' IDENTIFIED BY \'plainlist123\'; GRANT ALL ON plainlist.* TO \'plainlist\'@\'localhost\';"');
    process.exit(1);
  });
