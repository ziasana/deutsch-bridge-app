-- Reading articles now belong to an admin-managed Category ("Thema") instead of a free-text
-- topic label, so students can filter by it. Existing topic text is preserved by promoting each
-- distinct value into its own category and linking the matching articles to it; articles with a
-- blank/missing topic are left uncategorized (category_id stays null) rather than forced into one.
CREATE TABLE reading_categories (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

ALTER TABLE reading_articles ADD COLUMN category_id VARCHAR(255) REFERENCES reading_categories (id);

INSERT INTO reading_categories (id, title, created_at)
SELECT substr(md5(random()::text || clock_timestamp()::text), 1, 21), t.topic, now()
FROM (SELECT DISTINCT topic FROM reading_articles WHERE topic IS NOT NULL AND btrim(topic) <> '') t;

UPDATE reading_articles ra
SET category_id = rc.id
FROM reading_categories rc
WHERE rc.title = ra.topic AND ra.topic IS NOT NULL AND btrim(ra.topic) <> '';

ALTER TABLE reading_articles DROP COLUMN topic;
