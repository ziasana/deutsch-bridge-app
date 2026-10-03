-- Lets a user bookmark grammar lessons for quick access via the "Bookmarked" filter on the
-- grammar list and the bookmark button on the lesson page, mirroring reading_article_bookmarks.
CREATE TABLE grammar_lesson_bookmarks (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users (id),
    grammar_lesson_id VARCHAR(255) NOT NULL REFERENCES grammar_lessons (id),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_grammar_lesson_bookmarks_user_lesson UNIQUE (user_id, grammar_lesson_id)
);
