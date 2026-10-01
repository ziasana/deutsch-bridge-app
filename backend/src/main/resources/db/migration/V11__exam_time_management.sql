-- Exam time management: admin-configured recommended time per Teil, the total duration of the
-- timed block per exam level, and one record per timed practice run.
CREATE TABLE exam_configurations (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    exam_type VARCHAR(255) NOT NULL,
    level VARCHAR(255) NOT NULL,
    total_duration_minutes INTEGER NOT NULL,
    enabled BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_exam_configurations_exam_level UNIQUE (exam_type, level)
);

CREATE TABLE exam_time_configurations (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    exam_type VARCHAR(255) NOT NULL,
    level VARCHAR(255) NOT NULL,
    section VARCHAR(255) NOT NULL,
    teil INTEGER NOT NULL,
    recommended_minutes INTEGER NOT NULL,
    enabled BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_exam_time_configurations_part UNIQUE (exam_type, level, section, teil)
);

CREATE TABLE exam_practice_sessions (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    exam_type VARCHAR(255) NOT NULL,
    level VARCHAR(255),
    section VARCHAR(255) NOT NULL,
    teil INTEGER,
    scope VARCHAR(255) NOT NULL,
    exercise_id VARCHAR(255),
    mode VARCHAR(255) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    elapsed_seconds INTEGER,
    target_seconds INTEGER,
    questions_total INTEGER,
    questions_answered INTEGER,
    correct_answers INTEGER,
    score DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_exam_practice_sessions_user ON exam_practice_sessions (user_id, completed_at);
