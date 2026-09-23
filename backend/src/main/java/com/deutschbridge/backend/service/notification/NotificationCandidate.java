package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.enums.NotificationPriority;
import com.deutschbridge.backend.model.enums.NotificationType;

import java.time.Instant;
import java.util.Map;

/**
 * A notification the learner's current state would justify - not yet a notification. The dispatcher
 * decides whether it becomes one after preferences, quiet hours, frequency limits and deduplication.
 *
 * @param dedupKey logical identity of the opportunity (type + learning context [+ local date]); never
 *                 derived from the notification text
 * @param rank     position in the rule engine's evaluation order, the tie-breaker after priority
 */
public record NotificationCandidate(
        NotificationType type,
        String templateKey,
        NotificationPriority priority,
        String dedupKey,
        String entityType,
        String entityId,
        String actionUrl,
        Map<String, String> params,
        Instant expiresAt,
        int rank
) {
}
