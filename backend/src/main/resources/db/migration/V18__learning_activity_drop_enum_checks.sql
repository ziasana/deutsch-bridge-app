-- Same reasoning as V5: Hibernate created CHECK constraints on learning_activity's enum columns that
-- hard-code the enum values, so adding LearningModule.REDEMITTEL / the REDEMITTEL_* activity types made
-- every insert fail (and rolled back the surrounding learn/practice/review transaction). The columns are
-- @Enumerated(STRING) with ddl-auto=validate, so the DB-level CHECK is redundant.
ALTER TABLE IF EXISTS learning_activity DROP CONSTRAINT IF EXISTS learning_activity_module_check;
ALTER TABLE IF EXISTS learning_activity DROP CONSTRAINT IF EXISTS learning_activity_activity_type_check;
