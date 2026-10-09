-- "Mündlicher Ausdruck lernen": the shared learning content of each speaking Teil (intro, tips, questions, Redemittel,
-- typical mistakes, self-assessment checklist), stored once per level + Teil instead of being repeated in every exercise.
CREATE TABLE speaking_guides (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    level VARCHAR(255) NOT NULL,
    part_number INTEGER NOT NULL,
    content jsonb NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(255),
    CONSTRAINT uk_speaking_guides_level_part UNIQUE (level, part_number)
);
