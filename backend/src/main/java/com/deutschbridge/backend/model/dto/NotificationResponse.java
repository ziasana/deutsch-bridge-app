package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.Notification;

import java.time.Instant;

/** Learner-facing notification. Priority and dedup internals are deliberately not exposed. */
public record NotificationResponse(
        String id,
        String type,
        String category,
        String title,
        String body,
        String entityType,
        String entityId,
        String actionUrl,
        boolean read,
        String status,
        Instant createdAt
) {
    public static NotificationResponse fromEntity(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType().name(),
                n.getCategory().name(),
                n.getTitle(),
                n.getBody(),
                n.getEntityType(),
                n.getEntityId(),
                n.getActionUrl(),
                n.isRead(),
                n.getStatus().name(),
                n.getSentAt() != null ? n.getSentAt() : n.getCreatedAt()
        );
    }
}
