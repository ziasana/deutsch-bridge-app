-- Optional admin-edited labels ("a", "b", "1", ...) shown in front of each shared answer option.
-- Parallel to answer_options by index; a missing/blank entry falls back to the positional letter.
ALTER TABLE exam_exercises ADD COLUMN IF NOT EXISTS answer_option_labels jsonb;
