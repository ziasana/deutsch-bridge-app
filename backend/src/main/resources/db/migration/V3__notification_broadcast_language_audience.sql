-- Adds the LANGUAGE audience option (send to users by PreferredLanguage: EN/DE/PR) to admin broadcasts.
-- ddl-auto is now "validate" (see V1__baseline.sql), so new columns/constraints must land here instead
-- of relying on Hibernate to create them.
ALTER TABLE notification_broadcasts ADD COLUMN audience_language VARCHAR(255);

ALTER TABLE notification_broadcasts ADD CONSTRAINT notification_broadcasts_audience_language_check
    CHECK (audience_language IN ('EN', 'DE', 'PR'));

ALTER TABLE notification_broadcasts DROP CONSTRAINT notification_broadcasts_audience_type_check;
ALTER TABLE notification_broadcasts ADD CONSTRAINT notification_broadcasts_audience_type_check
    CHECK (audience_type IN ('ALL', 'LEVEL', 'ACCOUNT_TYPE', 'LANGUAGE', 'SPECIFIC_USERS'));
