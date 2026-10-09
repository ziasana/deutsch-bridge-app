-- Mündlicher Ausdruck (speaking): new exam section MUENDLICHER_AUSDRUCK and task types TOPIC_INTERVIEW, OPINION_DISCUSSION and
-- JOINT_PLANNING. exam_exercises.section / task_type are VARCHAR columns mapped with @Enumerated(STRING) and ddl-auto=validate guards the
-- mapping (see V5), so no data change is needed. Databases that were first built by the old ddl-auto=update pass may still carry the
-- Hibernate-generated CHECK constraints on these two columns, which would reject the new values - drop them if present.
ALTER TABLE exam_exercises DROP CONSTRAINT IF EXISTS exam_exercises_section_check;
ALTER TABLE exam_exercises DROP CONSTRAINT IF EXISTS exam_exercises_task_type_check;
