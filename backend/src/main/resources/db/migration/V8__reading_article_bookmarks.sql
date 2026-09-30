-- Lets a user bookmark reading articles for quick access via the "Bookmarked" filter on the
-- reading list, mirroring expression_bookmarks/vocabulary_bookmarks.
CREATE TABLE reading_article_bookmarks (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users (id),
    reading_article_id VARCHAR(255) NOT NULL REFERENCES reading_articles (id),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_reading_article_bookmarks_user_article UNIQUE (user_id, reading_article_id)
);
