-- Surfaces a stuck SCHEDULED broadcast (retried every 60s by NotificationScheduler.dispatchDueBroadcasts
-- and failing the same way each time) to admins instead of only logging it server-side.
ALTER TABLE notification_broadcasts ADD COLUMN IF NOT EXISTS last_dispatch_error TEXT;
ALTER TABLE notification_broadcasts ADD COLUMN IF NOT EXISTS last_dispatch_attempt_at TIMESTAMPTZ(6);
