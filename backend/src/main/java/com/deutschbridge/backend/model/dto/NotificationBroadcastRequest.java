package com.deutschbridge.backend.model.dto;

import java.time.Instant;
import java.util.List;

/** scheduledAt null (or in the past) means "send now". audienceLevel/audienceAccountType/audienceUserIds
 * are only read for the matching audienceType. */
public record NotificationBroadcastRequest(
        String title,
        String message,
        String type,
        String audienceType,
        String audienceLevel,
        String audienceAccountType,
        String audienceLanguage,
        List<String> audienceUserIds,
        Instant scheduledAt
) {
}
