-- DTZ Schreiben: the learner answers one of two alternative tasks (Aufgabe A or Aufgabe B); the attempt records which one.
-- Null for every other writing exercise (they have a single task).
ALTER TABLE writing_attempts ADD COLUMN selected_task VARCHAR(8);
