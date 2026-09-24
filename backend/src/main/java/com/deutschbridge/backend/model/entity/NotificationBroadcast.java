package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.AccountType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.NotificationAudienceType;
import com.deutschbridge.backend.model.enums.NotificationBroadcastStatus;
import com.deutschbridge.backend.model.enums.NotificationType;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * One admin compose/send action - not one row per recipient. When it fires (immediately, or picked up
 * by NotificationScheduler.dispatchDueBroadcasts once scheduledAt is reached), NotificationBroadcastDispatchService
 * resolves its audience into user ids and creates one Notification row per recipient.
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(name = "notification_broadcasts")
public class NotificationBroadcast {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationAudienceType audienceType;

    @Enumerated(EnumType.STRING)
    private LearningLevel audienceLevel;

    @Enumerated(EnumType.STRING)
    private AccountType audienceAccountType;

    @Enumerated(EnumType.STRING)
    private PreferredLanguage audienceLanguage;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> audienceUserIds = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationBroadcastStatus status = NotificationBroadcastStatus.SCHEDULED;

    private Instant scheduledAt;
    private Instant sentAt;
    private Integer recipientCount;

    /** Set by NotificationScheduler.dispatchDueBroadcasts on a failed attempt so a SCHEDULED broadcast
     * that's actually stuck retrying is visible to admins, not just in server logs. Cleared on success. */
    @Column(columnDefinition = "TEXT")
    private String lastDispatchError;
    private Instant lastDispatchAttemptAt;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "created_by_email", nullable = false)
    private String createdByEmail;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = "bcst-" + NanoIdUtils.randomNanoId();
        }
        Instant now = Instant.now();
        if (this.createdAt == null) this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
