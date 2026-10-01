-- Optional AI feedback (JSON), generated on request for a submitted writing attempt.
ALTER TABLE writing_attempts ADD COLUMN ai_feedback TEXT;
