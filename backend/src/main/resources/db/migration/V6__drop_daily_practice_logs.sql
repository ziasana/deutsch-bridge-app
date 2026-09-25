-- DailyPracticeLog and its repository were removed in favor of the LearningActivity event log
-- (see LearningActivityService), but no prior migration dropped the table it backed, leaving
-- daily_practice_logs orphaned in every environment with nothing referencing it anymore.
DROP TABLE IF EXISTS daily_practice_logs;
