-- Adds the LANGUAGE audience option (send to users by PreferredLanguage: EN/DE/PR) to admin broadcasts.
-- ddl-auto is now "validate" (see V1__baseline.sql), so new columns/constraints must land here instead
-- of relying on Hibernate to create them.
--
-- Unlike the rest of the schema (still built by the old ddl-auto=update pass, per V1's comment),
-- notification_broadcasts is new in this same feature, so its complete shape is fully known here -
-- this migration creates it outright rather than assuming a prior ddl-auto pass already built it.
-- Every statement is idempotent so it's also a safe no-op against a database where ddl-auto=update (or
-- an earlier run of this migration) already created the table/column/constraints.
CREATE TABLE IF NOT EXISTS notification_broadcasts (
    id                     VARCHAR(255) PRIMARY KEY,
    title                  VARCHAR(255) NOT NULL,
    message                TEXT NOT NULL,
    type                   VARCHAR(255) NOT NULL,
    audience_type          VARCHAR(255) NOT NULL,
    audience_level         VARCHAR(255),
    audience_account_type  VARCHAR(255),
    audience_user_ids      JSONB,
    status                 VARCHAR(255) NOT NULL,
    scheduled_at           TIMESTAMPTZ(6),
    sent_at                TIMESTAMPTZ(6),
    recipient_count        INTEGER,
    created_by             VARCHAR(255) NOT NULL,
    created_by_email       VARCHAR(255) NOT NULL,
    created_at             TIMESTAMPTZ(6) NOT NULL,
    updated_at             TIMESTAMPTZ(6)
);

ALTER TABLE notification_broadcasts ADD COLUMN IF NOT EXISTS audience_language VARCHAR(255);

ALTER TABLE notification_broadcasts DROP CONSTRAINT IF EXISTS notification_broadcasts_type_check;
ALTER TABLE notification_broadcasts ADD CONSTRAINT notification_broadcasts_type_check CHECK (type IN (
  'REVIEW_DUE','DAILY_WORDS_READY','DAILY_PLAN_READY','DAILY_PLAN_INCOMPLETE','CONTINUE_LEARNING',
  'GRAMMAR_RECOMMENDATION','READING_RECOMMENDATION','LISTENING_RECOMMENDATION','EXPRESSION_REVIEW','VOCABULARY_REVIEW',
  'EXAM_PRACTICE_READY','EXAM_PLAN_REMINDER','MILESTONE_REACHED','DAILY_GOAL_REACHED','WEEKLY_PROGRESS','STREAK_MILESTONE',
  'WELCOME','ACCOUNT_UPDATE','SYSTEM_MESSAGE','AI_LIMIT_REACHED','PREMIUM_FEATURE_AVAILABLE','PREMIUM_EXPIRING',
  'ANNOUNCEMENT','PROMOTION'
));

ALTER TABLE notification_broadcasts DROP CONSTRAINT IF EXISTS notification_broadcasts_audience_type_check;
ALTER TABLE notification_broadcasts ADD CONSTRAINT notification_broadcasts_audience_type_check
    CHECK (audience_type IN ('ALL', 'LEVEL', 'ACCOUNT_TYPE', 'LANGUAGE', 'SPECIFIC_USERS'));

ALTER TABLE notification_broadcasts DROP CONSTRAINT IF EXISTS notification_broadcasts_audience_level_check;
ALTER TABLE notification_broadcasts ADD CONSTRAINT notification_broadcasts_audience_level_check
    CHECK (audience_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));

ALTER TABLE notification_broadcasts DROP CONSTRAINT IF EXISTS notification_broadcasts_audience_account_type_check;
ALTER TABLE notification_broadcasts ADD CONSTRAINT notification_broadcasts_audience_account_type_check
    CHECK (audience_account_type IN ('BASIC', 'PREMIUM'));

ALTER TABLE notification_broadcasts DROP CONSTRAINT IF EXISTS notification_broadcasts_audience_language_check;
ALTER TABLE notification_broadcasts ADD CONSTRAINT notification_broadcasts_audience_language_check
    CHECK (audience_language IN ('EN', 'DE', 'PR'));

ALTER TABLE notification_broadcasts DROP CONSTRAINT IF EXISTS notification_broadcasts_status_check;
ALTER TABLE notification_broadcasts ADD CONSTRAINT notification_broadcasts_status_check
    CHECK (status IN ('SCHEDULED', 'SENT', 'CANCELLED'));
