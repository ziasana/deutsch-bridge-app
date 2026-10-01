-- Per-user progress through the "Schreiben lernen" stations (one row per level + station).
CREATE TABLE writing_learn_progress (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    level VARCHAR(255) NOT NULL,
    station VARCHAR(255) NOT NULL,
    correct INTEGER NOT NULL,
    total INTEGER NOT NULL,
    completed_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_writing_learn_progress UNIQUE (user_id, level, station)
);
