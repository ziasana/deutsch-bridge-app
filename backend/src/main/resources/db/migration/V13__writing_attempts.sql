-- Planning support for writing tasks and learner submissions.
ALTER TABLE exam_exercises ADD COLUMN requires_planning BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE exam_exercises ADD COLUMN leitpunkte JSONB;

CREATE TABLE writing_attempts (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    exercise_id VARCHAR(255) NOT NULL,
    level VARCHAR(255),
    mode VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    plan_notes TEXT,
    word_count INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL,
    parent_attempt_id VARCHAR(255),
    submitted_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_writing_attempts_user_exercise ON writing_attempts (user_id, exercise_id);
