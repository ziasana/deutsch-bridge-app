package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.NotificationBroadcast;

import java.time.Instant;
import java.util.List;

public record NotificationBroadcastResponse(
        String id,
        String title,
        String message,
        String type,
        String audienceType,
        String audienceLevel,
        String audienceAccountType,
        String audienceLanguage,
        List<String> audienceUserIds,
        String status,
        Instant scheduledAt,
        Instant sentAt,
        Integer recipientCount,
        String lastDispatchError,
        Instant lastDispatchAttemptAt,
        String createdByEmail,
        Instant createdAt
) {
    public static NotificationBroadcastResponse fromEntity(NotificationBroadcast b) {
        return new NotificationBroadcastResponse(
                b.getId(),
                b.getTitle(),
                b.getMessage(),
                b.getType().name(),
                b.getAudienceType().name(),
                b.getAudienceLevel() != null ? b.getAudienceLevel().name() : null,
                b.getAudienceAccountType() != null ? b.getAudienceAccountType().name() : null,
                b.getAudienceLanguage() != null ? b.getAudienceLanguage().name() : null,
                b.getAudienceUserIds(),
                b.getStatus().name(),
                b.getScheduledAt(),
                b.getSentAt(),
                b.getRecipientCount(),
                b.getLastDispatchError(),
                b.getLastDispatchAttemptAt(),
                b.getCreatedByEmail(),
                b.getCreatedAt()
        );
    }
}
