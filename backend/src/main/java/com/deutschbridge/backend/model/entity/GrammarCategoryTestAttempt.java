package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * The user's latest attempt at a category's aggregate test - retaking overwrites this row
 * rather than accumulating history (one row per user per category).
 */
@Entity(name = "grammarCategoryTestAttempts")
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "category_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrammarCategoryTestAttempt {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private GrammarCategory category;

    private int score;
    private int total;
    private boolean passed;
    private boolean completed;

    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
