package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.NotificationCategory;
import com.deutschbridge.backend.model.enums.NotificationPriority;
import com.deutschbridge.backend.model.enums.NotificationStatus;
import com.deutschbridge.backend.model.enums.NotificationType;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * One learner-facing notification. Title/body are rendered from a localized NotificationTemplate at
 * creation time; {@code params} keeps the raw placeholder values so a still-unread notification can be
 * refreshed in place (e.g. "8 words" -> "12 words") instead of creating a duplicate.
 *
 * {@code dedupKey} identifies the logical learning opportunity (type + learning context + local date,
 * never the text) - see NotificationRuleEngine. Timestamps are Instants because "today" is evaluated
 * in each learner's own timezone.
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(name = "notifications",
        uniqueConstraints = @UniqueConstraint(name = "uk_notification_user_dedup", columnNames = {"user_id", "dedup_key"}),
        indexes = {
                @Index(name = "idx_notification_user_status", columnList = "user_id, status"),
                @Index(name = "idx_notification_user_created", columnList = "user_id, created_at")
        })
public class Notification {

    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationPriority priority;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    private String entityType;
    private String entityId;
    private String actionUrl;

    @Column(name = "dedup_key")
    private String dedupKey;

    private String templateKey;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> params = new HashMap<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status = NotificationStatus.CREATED;

    private Instant scheduledAt;
    private Instant sentAt;
    private Instant deliveredAt;
    private Instant readAt;
    private Instant clickedAt;
    private Instant completedAt;
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = "ntf-" + NanoIdUtils.randomNanoId();
        }
        Instant now = Instant.now();
        if (this.createdAt == null) this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isRead() {
        return readAt != null;
    }
}
