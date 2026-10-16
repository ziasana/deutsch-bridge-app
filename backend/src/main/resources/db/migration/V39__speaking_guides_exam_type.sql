-- "Mündlicher Ausdruck lernen" now exists per exam (TELC, DTZ): guides and learner progress are keyed by exam type as well.
ALTER TABLE speaking_guides ADD COLUMN exam_type VARCHAR(255) NOT NULL DEFAULT 'TELC';
ALTER TABLE speaking_guides DROP CONSTRAINT uk_speaking_guides_level_part;
ALTER TABLE speaking_guides ADD CONSTRAINT uk_speaking_guides_exam_level_part UNIQUE (exam_type, level, part_number);

ALTER TABLE speaking_learn_progress ADD COLUMN exam_type VARCHAR(255) NOT NULL DEFAULT 'TELC';
ALTER TABLE speaking_learn_progress DROP CONSTRAINT uk_speaking_learn_progress;
ALTER TABLE speaking_learn_progress ADD CONSTRAINT uk_speaking_learn_progress_exam UNIQUE (user_id, exam_type, level, part_number, station);
