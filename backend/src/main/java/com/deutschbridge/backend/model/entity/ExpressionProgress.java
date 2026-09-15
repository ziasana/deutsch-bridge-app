package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.ExpressionMasteryLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Per-user, per-expression learning state. Scores are 0-100 and track passive vs active knowledge
 * separately (recognitionScore/recallScore are "can I recognize/recall it", productionScore is
 * "can I actually use it") so mastery can't be reached through recognition alone - see
 * ExpressionPracticeService for the weighting and mastery-transition logic.
 */
@Entity(name = "expression_progress")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "expression_id"}))
public class ExpressionProgress {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    private Expression expression;

    @Column(columnDefinition = "double precision default 0")
    private double recognitionScore;

    @Column(columnDefinition = "double precision default 0")
    private double recallScore;

    @Column(columnDefinition = "double precision default 0")
    private double contextScore;

    @Column(columnDefinition = "double precision default 0")
    private double transformationScore;

    @Column(columnDefinition = "double precision default 0")
    private double productionScore;

    @Column(columnDefinition = "integer default 0")
    private int reviewCount;

    @Column(columnDefinition = "integer default 0")
    private int correctCount;

    @Column(columnDefinition = "integer default 0")
    private int incorrectCount;

    private LocalDateTime lastReviewedAt;
    private LocalDateTime nextReviewAt;

    @Column(columnDefinition = "integer default 0")
    private int srsInterval;

    @Column(columnDefinition = "double precision default 2.5")
    private double srsEaseFactor = 2.5;

    @Column(columnDefinition = "integer default 0")
    private int srsRepetitions;

    @Enumerated(EnumType.STRING)
    private ExpressionMasteryLevel masteryLevel = ExpressionMasteryLevel.NEW;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        if (this.nextReviewAt == null) {
            this.nextReviewAt = LocalDateTime.now();
        }
    }
}
