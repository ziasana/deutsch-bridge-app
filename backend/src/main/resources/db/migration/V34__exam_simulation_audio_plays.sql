-- Server-side count of audio plays per attempt/part/clip, for profiles that limit how often a listening clip may be played.
CREATE TABLE exam_simulation_audio_plays (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    attempt_id VARCHAR(255) NOT NULL,
    part_key VARCHAR(255) NOT NULL,
    passage_id VARCHAR(255) NOT NULL,
    plays INTEGER NOT NULL,
    CONSTRAINT uq_exam_sim_audio_play UNIQUE (attempt_id, part_key, passage_id)
);
