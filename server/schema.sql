-- PlainList Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS plainlist
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE plainlist;

-- ─── Users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(20)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,          -- bcrypt hash
  is_admin   TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Plans (tasks & habits) ────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED    NOT NULL,
  type       ENUM('habit','todo') NOT NULL DEFAULT 'habit',
  name       VARCHAR(200)    NOT NULL,
  time       CHAR(5)         NOT NULL DEFAULT '09:00',  -- HH:MM
  sort_order INT             NOT NULL DEFAULT 0,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_plans_user (user_id)
) ENGINE=InnoDB;

-- ─── Daily check-ins ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS checks (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plan_id    BIGINT UNSIGNED NOT NULL,
  check_date DATE            NOT NULL,       -- e.g. 2026-03-03
  done       TINYINT(1)      NOT NULL DEFAULT 0,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  UNIQUE KEY uk_plan_date (plan_id, check_date),
  INDEX idx_checks_date (check_date)
) ENGINE=InnoDB;

-- ─── Seed admin account ───────────────────────────────────
-- Password: admin  (bcrypt hash will be inserted by server on first run)

-- ─── User settings (plugin storage) ──────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED    NOT NULL,
  key_name   VARCHAR(100)    NOT NULL,   -- e.g. 'installed_plugins'
  value      TEXT            NOT NULL,   -- JSON string
  updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_key (user_id, key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
