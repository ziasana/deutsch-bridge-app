-- Lets a user bookmark exam exercises ("Aufgaben") so unfinished ones can be pinned in the
-- "Saved for later" strip on the exam-prep page, mirroring grammar_lesson_bookmarks.
CREATE TABLE exam_exercise_bookmarks (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users (id),
    exercise_id VARCHAR(255) NOT NULL REFERENCES exam_exercises (id),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_exam_exercise_bookmarks_user_exercise UNIQUE (user_id, exercise_id)
);
