-- Per-user progress through the "Mündlicher Ausdruck lernen" stations (one row per level + Teil + station).
CREATE TABLE speaking_learn_progress (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    level VARCHAR(255) NOT NULL,
    part_number INTEGER NOT NULL,
    station VARCHAR(255) NOT NULL,
    correct INTEGER NOT NULL,
    total INTEGER NOT NULL,
    completed_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_speaking_learn_progress UNIQUE (user_id, level, part_number, station)
);
