-- Full exam simulation: versioned exam profiles, attempts with frozen profile/exercise snapshots, a per-user
-- no-repeat reservation ledger, autosaved answers, manual assessments and a state-transition audit trail.
-- No foreign keys to exam_exercises/users on purpose: attempts and the ledger are historical records that must
-- survive later content or account changes.

CREATE TABLE exam_profiles (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    code VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL,
    provider VARCHAR(255) NOT NULL,
    exam_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    exam_type VARCHAR(255) NOT NULL,
    level VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    oral_scoring_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    written_max_points NUMERIC(8, 2) NOT NULL,
    written_pass_threshold NUMERIC(8, 2) NOT NULL,
    oral_max_points NUMERIC(8, 2) NOT NULL,
    oral_pass_threshold NUMERIC(8, 2) NOT NULL,
    overall_result_policy VARCHAR(255) NOT NULL,
    answer_release_policy VARCHAR(255) NOT NULL,
    max_resumes INTEGER,
    exclude_practiced_exercises BOOLEAN NOT NULL DEFAULT FALSE,
    config JSONB NOT NULL,
    verification_note TEXT,
    source_profile_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(255),
    published_at TIMESTAMPTZ,
    published_by VARCHAR(255),
    CONSTRAINT uq_exam_profiles_code_version UNIQUE (code, version)
);

CREATE TABLE exam_simulation_attempts (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    profile_id VARCHAR(255) NOT NULL,
    profile_code VARCHAR(255) NOT NULL,
    profile_version INTEGER NOT NULL,
    profile_snapshot JSONB NOT NULL,
    status VARCHAR(255) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    final_deadline_at TIMESTAMPTZ NOT NULL,
    stages JSONB NOT NULL,
    resume_count INTEGER NOT NULL DEFAULT 0,
    finish_reason VARCHAR(255),
    result JSONB,
    updated_at TIMESTAMPTZ NOT NULL,
    lock_version BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_exam_sim_attempts_user ON exam_simulation_attempts (user_id, started_at);
CREATE INDEX idx_exam_sim_attempts_status_deadline ON exam_simulation_attempts (status, final_deadline_at);
-- Backstop for concurrent starts: at most one running attempt per learner and exam profile.
CREATE UNIQUE INDEX uq_exam_sim_attempt_active ON exam_simulation_attempts (user_id, profile_code) WHERE status = 'IN_PROGRESS';

CREATE TABLE exam_simulation_attempt_parts (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    attempt_id VARCHAR(255) NOT NULL,
    part_key VARCHAR(255) NOT NULL,
    ordinal INTEGER NOT NULL,
    exercise_id VARCHAR(255) NOT NULL,
    exercise_version INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    CONSTRAINT uq_exam_sim_attempt_part UNIQUE (attempt_id, part_key, ordinal)
);

CREATE TABLE exam_simulation_answers (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    attempt_id VARCHAR(255) NOT NULL,
    part_key VARCHAR(255) NOT NULL,
    question_id VARCHAR(255) NOT NULL,
    answer TEXT,
    flagged BOOLEAN NOT NULL DEFAULT FALSE,
    client_ts BIGINT NOT NULL DEFAULT 0,
    saved_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_exam_sim_answer UNIQUE (attempt_id, part_key, question_id)
);

CREATE TABLE exam_simulation_usage (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    profile_code VARCHAR(255) NOT NULL,
    exercise_id VARCHAR(255) NOT NULL,
    attempt_id VARCHAR(255) NOT NULL,
    part_key VARCHAR(255) NOT NULL,
    reserved_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_exam_sim_usage UNIQUE (user_id, profile_code, exercise_id)
);

CREATE TABLE exam_simulation_assessments (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    attempt_id VARCHAR(255) NOT NULL,
    part_key VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    criteria_scores JSONB,
    points NUMERIC(8, 2),
    comment TEXT,
    assessor_id VARCHAR(255),
    assessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_exam_sim_assessment UNIQUE (attempt_id, part_key, source)
);
CREATE INDEX idx_exam_sim_assessment_status ON exam_simulation_assessments (status, created_at);

CREATE TABLE exam_simulation_audit (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    subject_type VARCHAR(255) NOT NULL,
    subject_id VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    from_state VARCHAR(255),
    to_state VARCHAR(255),
    actor VARCHAR(255),
    details JSONB,
    occurred_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_exam_sim_audit_subject ON exam_simulation_audit (subject_type, subject_id, occurred_at);
