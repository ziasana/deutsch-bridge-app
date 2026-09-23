package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.entity.Notification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Emits the notification analytics events as structured log lines. There is no separate analytics
 * store in this app: the funnel numbers the admin sees are aggregated from the lifecycle timestamps on
 * the notification rows themselves (sentAt/readAt/clickedAt/completedAt), so these events are for
 * log-based tooling and debugging only.
 */
@Component
public class NotificationEventTracker {

    public static final String CREATED = "notification_created";
    public static final String SENT = "notification_sent";
    public static final String DELIVERED = "notification_delivered";
    public static final String READ = "notification_read";
    public static final String CLICKED = "notification_clicked";
    public static final String LEARNING_STARTED = "notification_learning_started";
    public static final String LEARNING_COMPLETED = "notification_learning_completed";
    public static final String EXPIRED = "notification_expired";

    private static final Logger log = LoggerFactory.getLogger(NotificationEventTracker.class);

    public void track(String event, Notification n) {
        log.info("event={} notificationId={} userId={} type={} entityType={} entityId={}",
                event, n.getId(), n.getUserId(), n.getType(), n.getEntityType(), n.getEntityId());
    }
}
