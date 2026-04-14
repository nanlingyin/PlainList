CREATE TABLE IF NOT EXISTS focus_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NULL,
  plan_name_snapshot VARCHAR(200) NULL,
  status ENUM('active', 'paused', 'completed', 'canceled') NOT NULL DEFAULT 'active',
  focus_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 25,
  break_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 5,
  accumulated_pause_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paused_at TIMESTAMP NULL DEFAULT NULL,
  ended_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_focus_sessions_user_started (user_id, started_at),
  INDEX idx_focus_sessions_user_status (user_id, status),
  CONSTRAINT fk_focus_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_focus_sessions_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
