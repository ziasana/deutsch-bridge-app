package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Records a single answered exercise question for a user, keyed by
 * "{lessonId}:{questionIndex}" so progress survives lesson/question reordering
 * at the individual-question level. Lets a user resume a quiz where they left off.
 */
@Entity
@Table(name = "exercise_progress", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "question_key"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseProgress {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "question_key", nullable = false)
    private String questionKey;

    private boolean correct;

    private LocalDateTime answeredAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        this.answeredAt = LocalDateTime.now();
    }
}
