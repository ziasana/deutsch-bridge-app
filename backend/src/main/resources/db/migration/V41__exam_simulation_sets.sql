-- Pre-generated exam sets shared by all learners of a profile. Starting a set copies its exercises into a new attempt.
CREATE TABLE exam_simulation_sets (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    profile_code VARCHAR(255) NOT NULL,
    number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    published_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    CONSTRAINT uq_exam_sim_set_number UNIQUE (profile_code, number)
);
CREATE INDEX idx_exam_sim_sets_profile ON exam_simulation_sets (profile_code, status);

CREATE TABLE exam_simulation_set_parts (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    set_id VARCHAR(255) NOT NULL,
    part_key VARCHAR(255) NOT NULL,
    ordinal INTEGER NOT NULL,
    exercise_id VARCHAR(255) NOT NULL,
    exercise_version INTEGER NOT NULL,
    CONSTRAINT uq_exam_sim_set_part UNIQUE (set_id, part_key, ordinal)
);
CREATE INDEX idx_exam_sim_set_parts_exercise ON exam_simulation_set_parts (exercise_id);

-- Attempts of the old per-user selection have no set.
ALTER TABLE exam_simulation_attempts ADD COLUMN set_id VARCHAR(255);
CREATE INDEX idx_exam_sim_attempts_set ON exam_simulation_attempts (user_id, set_id);
