package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** One mobile app install that can receive push notifications for {@code userId} (an Expo push token). */
@Entity
@Table(name = "push_devices",
        uniqueConstraints = @UniqueConstraint(name = "uk_push_devices_token", columnNames = "token"),
        indexes = @Index(name = "idx_push_devices_user", columnList = "user_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PushDevice {
    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false)
    private String token;

    /** "ios" or "android". */
    @Column(nullable = false, length = 16)
    private String platform;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = NanoIdUtils.randomNanoId();
    }
}
