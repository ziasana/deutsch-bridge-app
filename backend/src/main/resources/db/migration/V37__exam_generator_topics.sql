-- Topics an admin added to (CUSTOM) or removed from (HIDDEN, the token of a built-in topic) the topic list of one exam part's
-- content generator, so the list survives reloads and is shared by all admins.
CREATE TABLE exam_generator_topics (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    part_key VARCHAR(255) NOT NULL,
    kind VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT uq_exam_generator_topics UNIQUE (part_key, kind, topic)
);

CREATE INDEX idx_exam_generator_topics_part ON exam_generator_topics (part_key);
