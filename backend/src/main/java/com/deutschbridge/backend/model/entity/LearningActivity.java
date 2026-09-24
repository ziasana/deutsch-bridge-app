package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningActivityType;
import com.deutschbridge.backend.model.enums.LearningModule;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * One row per meaningful learning action (never a page view/login - see the enum javadoc). Written
 * only by the backend service that already owns the completion (vocabulary/expression practice
 * round, grammar lesson/category test, reading or exam attempt, daily word, AI tutor message), so
 * a genuine action is recorded exactly once - see {@link com.deutschbridge.backend.service.LearningActivityService}.
 * Powers the admin "Learner Activity" / "Content & Feature Usage" analytics.
 */
@Entity
@Table(name = "learning_activity", indexes = {
        @Index(name = "idx_learning_activity_user_created", columnList = "user_id, created_at"),
        @Index(name = "idx_learning_activity_module_created", columnList = "module, created_at"),
        @Index(name = "idx_learning_activity_type_created", columnList = "activity_type, created_at"),
        @Index(name = "idx_learning_activity_created", columnList = "created_at"),
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class LearningActivity {

    @Id
    @Column(unique = true, nullable = false)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "module", nullable = false)
    private LearningModule module;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false)
    private LearningActivityType activityType;

    /** Id of the practiced item/lesson/exercise/etc., for future drill-downs - never message content. */
    @Column(name = "entity_id")
    private String entityId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = "learn-act-" + NanoIdUtils.randomNanoId();
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
