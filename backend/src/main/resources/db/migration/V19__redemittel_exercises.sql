-- Admin-authored practice exercises per Redemittel (replaces the automatically generated questions).
CREATE TABLE redemittel_exercise (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    phrase_id VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    prompt TEXT,
    correct_answer TEXT,
    wrong_answers TEXT,
    sort_order INTEGER NOT NULL
);
CREATE INDEX idx_redemittel_exercise_phrase ON redemittel_exercise (phrase_id);
