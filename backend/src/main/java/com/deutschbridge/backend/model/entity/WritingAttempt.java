package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.WritingMode;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** One submitted text for a writing exercise. Revisions point at the attempt they improve. */
@Entity(name = "writingAttempts")
@Table(indexes = @Index(columnList = "userId, exerciseId"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WritingAttempt {
    @Id
    private String id;

    private String userId;
    private String exerciseId;
    private String level;

    @Enumerated(EnumType.STRING)
    private WritingMode mode;

    @Column(columnDefinition = "TEXT")
    private String text;

    /** The learner's planner notes (JSON array of strings), if a plan was made. */
    @Column(columnDefinition = "TEXT")
    private String planNotes;

    /** Structured feedback (JSON, see WritingFeedback). */
    @Column(columnDefinition = "TEXT")
    private String feedback;

    /** Optional AI feedback (JSON, see WritingAiFeedback), generated on request. */
    @Column(columnDefinition = "TEXT")
    private String aiFeedback;

    private int wordCount;
    private int attemptNumber;
    private String parentAttemptId;
    private LocalDateTime submittedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        if (this.submittedAt == null) {
            this.submittedAt = LocalDateTime.now();
        }
    }
}
