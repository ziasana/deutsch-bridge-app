-- Content-import / review workflow for exam exercises.
--   exam_type      which exam the exercise belongs to (TELC, GOETHE, TESTDAF, ...); existing rows are TELC.
--   status         DRAFT -> REVIEW -> APPROVED -> PUBLISHED (+ REJECTED / ARCHIVED). `published` stays the
--                  flag learners are filtered on and is kept in sync with status = PUBLISHED.
--   external_id    id from an imported JSON file (e.g. B1-L1-001), used to detect re-imports.
--   metadata       free-form JSONB (difficulty, topics, skills, source ...).
--   content_hash   fingerprint of the normalised passage texts, for exact-duplicate detection.
ALTER TABLE exam_exercises ADD COLUMN exam_type VARCHAR(255) NOT NULL DEFAULT 'TELC';
ALTER TABLE exam_exercises ADD COLUMN status VARCHAR(255);
ALTER TABLE exam_exercises ADD COLUMN external_id VARCHAR(255);
ALTER TABLE exam_exercises ADD COLUMN schema_version VARCHAR(32);
ALTER TABLE exam_exercises ADD COLUMN prompt_version VARCHAR(32);
ALTER TABLE exam_exercises ADD COLUMN metadata jsonb;
ALTER TABLE exam_exercises ADD COLUMN content_hash VARCHAR(64);
ALTER TABLE exam_exercises ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE exam_exercises ADD COLUMN created_by VARCHAR(255);
ALTER TABLE exam_exercises ADD COLUMN updated_by VARCHAR(255);
ALTER TABLE exam_exercises ADD COLUMN updated_at TIMESTAMP;
ALTER TABLE exam_exercises ADD COLUMN published_at TIMESTAMP;

UPDATE exam_exercises SET status = CASE WHEN published THEN 'PUBLISHED' ELSE 'DRAFT' END;
UPDATE exam_exercises SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE exam_exercises SET published_at = created_at WHERE published AND published_at IS NULL;

CREATE UNIQUE INDEX uk_exam_exercises_exam_external_id ON exam_exercises (exam_type, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_exam_exercises_status ON exam_exercises (status);
CREATE INDEX idx_exam_exercises_content_hash ON exam_exercises (content_hash);
