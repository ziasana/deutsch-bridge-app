-- paused_at is an Instant like every other time column of the attempt: store it with its time zone.
ALTER TABLE exam_simulation_attempts ALTER COLUMN paused_at TYPE TIMESTAMPTZ USING paused_at AT TIME ZONE 'UTC';
