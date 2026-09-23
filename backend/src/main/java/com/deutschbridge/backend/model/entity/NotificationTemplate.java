package com.deutschbridge.backend.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Localized, admin-editable notification copy with {{placeholder}} variables. {@code templateKey} is a
 * NotificationType name, optionally with a variant suffix (e.g. "MILESTONE_REACHED.WORDS").
 * {@code language} is one of "de", "en", "fa".
 */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(name = "notification_templates",
        uniqueConstraints = @UniqueConstraint(name = "uk_notification_template_key_lang", columnNames = {"template_key", "language"}))
public class NotificationTemplate {

    @Id
    private String id;

    @Column(name = "template_key", nullable = false)
    private String templateKey;

    @Column(nullable = false, length = 8)
    private String language;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    public void touch() {
        if (this.id == null) {
            this.id = templateKey + ":" + language;
        }
        this.updatedAt = Instant.now();
    }
}
