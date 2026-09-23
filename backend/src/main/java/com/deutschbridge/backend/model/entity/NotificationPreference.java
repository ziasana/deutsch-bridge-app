package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;
import java.time.LocalTime;

/**
 * A learner's notification settings. {@code learningRemindersEnabled} is the master switch for all
 * learning/reminder notifications (kept in sync with the legacy UserProfile.notificationsEnabled flag).
 *
 * The per-user max-per-day fields are optional overrides: null means "use the admin's global limit",
 * and a user value can only ever lower that global limit, never raise it.
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(name = "notification_preferences")
public class NotificationPreference {

    @Id
    private String id;

    @Column(name = "user_id", nullable = false, unique = true)
    private String userId;

    @ColumnDefault("true")
    private boolean learningRemindersEnabled = true;
    @ColumnDefault("true")
    private boolean reviewRemindersEnabled = true;
    @ColumnDefault("true")
    private boolean dailyPlanRemindersEnabled = true;
    @ColumnDefault("true")
    private boolean examRemindersEnabled = true;

    @ColumnDefault("true")
    private boolean progressNotificationsEnabled = true;
    @ColumnDefault("true")
    private boolean milestoneNotificationsEnabled = true;
    @ColumnDefault("true")
    private boolean weeklyProgressEnabled = true;

    @ColumnDefault("true")
    private boolean quietHoursEnabled = true;
    private LocalTime quietHoursStart = LocalTime.of(22, 0);
    private LocalTime quietHoursEnd = LocalTime.of(8, 0);

    private Integer maxLearningNotificationsPerDay;
    private Integer maxReminderNotificationsPerDay;

    private LocalTime preferredReminderTime = LocalTime.of(18, 30);

    /** IANA zone id, e.g. "Europe/Berlin". Null until the client reports the device timezone. */
    private String timezone;

    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = "npref-" + NanoIdUtils.randomNanoId();
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
