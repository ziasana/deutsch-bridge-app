-- These CHECK constraints hand-duplicate Java enum values as SQL string literals, so every new enum
-- constant (NotificationType.ANNOUNCEMENT/PROMOTION, NotificationAudienceType.LANGUAGE, ...) required
-- both a Java change and a matching migration to keep them in sync - exactly the recurring maintenance
-- cost that caused the notifications_type_check outage this feature originally hit. All of these columns
-- are already @Enumerated(EnumType.STRING) with ddl-auto=validate enforcing the mapping, so the DB-level
-- CHECK is redundant with application-level type safety. Dropped rather than perpetually kept in sync.
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_category_check;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_priority_check;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_status_check;

ALTER TABLE notification_broadcasts DROP CONSTRAINT IF EXISTS notification_broadcasts_type_check;
ALTER TABLE notification_broadcasts DROP CONSTRAINT IF EXISTS notification_broadcasts_audience_type_check;
ALTER TABLE notification_broadcasts DROP CONSTRAINT IF EXISTS notification_broadcasts_audience_level_check;
ALTER TABLE notification_broadcasts DROP CONSTRAINT IF EXISTS notification_broadcasts_audience_account_type_check;
ALTER TABLE notification_broadcasts DROP CONSTRAINT IF EXISTS notification_broadcasts_audience_language_check;
ALTER TABLE notification_broadcasts DROP CONSTRAINT IF EXISTS notification_broadcasts_status_check;
