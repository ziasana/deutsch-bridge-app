package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.RedemittelStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * One user's learning state for one Redemittel. A row exists from the moment the learner
 * finishes learning the expression; before that it is "new". See RedemittelScheduler for the stages.
 */
@Entity(name = "redemittelProgress")
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "phraseId"}),
        indexes = @Index(columnList = "userId, nextReviewAt"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RedemittelProgress {
    @Id
    private String id;

    private String userId;
    private String phraseId;

    @Enumerated(EnumType.STRING)
    private RedemittelStatus status = RedemittelStatus.LEARNING;

    /** Index into RedemittelScheduler.INTERVAL_DAYS; the number of intervals already passed. */
    private int stage;

    private int reviewCount;
    private int correctCount;
    private int incorrectCount;

    private LocalDateTime learnedAt;
    private LocalDateTime lastReviewedAt;
    /** Null once MASTERED. */
    private LocalDateTime nextReviewAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}
