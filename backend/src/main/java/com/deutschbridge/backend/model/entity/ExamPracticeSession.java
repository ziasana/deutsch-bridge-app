package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.ExamPracticeScope;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTimeMode;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * One timed practice run. startedAt/completedAt are set by the server, and elapsedSeconds is
 * derived from them on completion - the browser's own timer is only a UI representation.
 * A session with no completedAt was abandoned and is ignored by analytics.
 */
@Entity
@Table(name = "exam_practice_sessions",
        indexes = @Index(name = "idx_exam_practice_sessions_user", columnList = "user_id, completed_at"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamPracticeSession {
    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type", nullable = false)
    private ExamType examType = ExamType.TELC;

    /** Null for level-agnostic exercises, which have no timing configuration. */
    @Enumerated(EnumType.STRING)
    private LearningLevel level;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamSection section;

    private Integer teil;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamPracticeScope scope;

    /** Set for EXERCISE scope only. */
    @Column(name = "exercise_id")
    private String exerciseId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamTimeMode mode;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "elapsed_seconds")
    private Integer elapsedSeconds;

    @Column(name = "target_seconds")
    private Integer targetSeconds;

    @Column(name = "questions_total")
    private Integer questionsTotal;

    @Column(name = "questions_answered")
    private Integer questionsAnswered;

    @Column(name = "correct_answers")
    private Integer correctAnswers;

    private Double score;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }
}
