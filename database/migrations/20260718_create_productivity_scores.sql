CREATE TABLE IF NOT EXISTS productivity_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score_date DATE NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    task_score INTEGER NOT NULL DEFAULT 0,
    habit_score INTEGER NOT NULL DEFAULT 0,
    focus_score INTEGER NOT NULL DEFAULT 0,
    overdue_penalty INTEGER NOT NULL DEFAULT 0,
    level VARCHAR(30) NOT NULL DEFAULT 'Getting started',
    metrics JSON NOT NULL DEFAULT '{}',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_productivity_score_user_date UNIQUE (user_id, score_date)
);

CREATE INDEX IF NOT EXISTS ix_productivity_scores_user_id
    ON productivity_scores (user_id);

CREATE INDEX IF NOT EXISTS ix_productivity_scores_score_date
    ON productivity_scores (score_date);
