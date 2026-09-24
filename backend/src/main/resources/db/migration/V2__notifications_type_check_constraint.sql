-- Hibernate auto-generated this CHECK constraint from NotificationType's enum constants when the
-- notifications table was first created, and ddl-auto=update never revises it as new constants are
-- added to the enum (see ANNOUNCEMENT/PROMOTION, added for admin broadcast notifications). Keep this
-- list in sync with NotificationType.java whenever a constant is added or removed.
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'REVIEW_DUE','DAILY_WORDS_READY','DAILY_PLAN_READY','DAILY_PLAN_INCOMPLETE','CONTINUE_LEARNING',
  'GRAMMAR_RECOMMENDATION','READING_RECOMMENDATION','LISTENING_RECOMMENDATION','EXPRESSION_REVIEW','VOCABULARY_REVIEW',
  'EXAM_PRACTICE_READY','EXAM_PLAN_REMINDER','MILESTONE_REACHED','DAILY_GOAL_REACHED','WEEKLY_PROGRESS','STREAK_MILESTONE',
  'WELCOME','ACCOUNT_UPDATE','SYSTEM_MESSAGE','AI_LIMIT_REACHED','PREMIUM_FEATURE_AVAILABLE','PREMIUM_EXPIRING',
  'ANNOUNCEMENT','PROMOTION'
));
