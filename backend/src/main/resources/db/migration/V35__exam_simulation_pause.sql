-- A learner can pause a running exam: the clock stops at paused_at and, on continuing, the running section's deadline moves by the pause.
ALTER TABLE exam_simulation_attempts ADD COLUMN paused_at TIMESTAMP;
ALTER TABLE exam_simulation_attempts ADD COLUMN pause_count INTEGER NOT NULL DEFAULT 0;
