-- Data-driven content for "Schreiben lernen": structured guide items (format, strategy steps,
-- structure parts, examples, sentence patterns, common mistakes, checklist) and Redemittel.
CREATE TABLE writing_guide_items (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    level VARCHAR(255) NOT NULL,
    kind VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    data TEXT,
    sort_order INTEGER NOT NULL,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_writing_guide_items_level_kind ON writing_guide_items (level, kind);

CREATE TABLE writing_phrases (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    level VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    phrase VARCHAR(1000) NOT NULL,
    explanation TEXT,
    example TEXT,
    formality VARCHAR(255),
    usage_note TEXT,
    sort_order INTEGER NOT NULL,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_writing_phrases_level_category ON writing_phrases (level, category);
