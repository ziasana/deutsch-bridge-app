-- Redemittel learning module: richer learner-facing fields on the existing Redemittel (writing_phrases),
-- plus per-user progress and a personal collection. No Redemittel are duplicated.
ALTER TABLE writing_phrases ADD COLUMN meaning_en TEXT;
ALTER TABLE writing_phrases ADD COLUMN meaning_fa TEXT;
ALTER TABLE writing_phrases ADD COLUMN grammar_pattern TEXT;
ALTER TABLE writing_phrases ADD COLUMN common_mistake TEXT;
ALTER TABLE writing_phrases ADD COLUMN similar_expressions TEXT;
ALTER TABLE writing_phrases ADD COLUMN contexts VARCHAR(255);

CREATE TABLE redemittel_progress (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    phrase_id VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    stage INTEGER NOT NULL,
    review_count INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    incorrect_count INTEGER NOT NULL,
    learned_at TIMESTAMP NOT NULL,
    last_reviewed_at TIMESTAMP,
    next_review_at TIMESTAMP,
    CONSTRAINT uk_redemittel_progress UNIQUE (user_id, phrase_id)
);
CREATE INDEX idx_redemittel_progress_due ON redemittel_progress (user_id, next_review_at);

CREATE TABLE redemittel_collection (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    phrase_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_redemittel_collection UNIQUE (user_id, phrase_id)
);
