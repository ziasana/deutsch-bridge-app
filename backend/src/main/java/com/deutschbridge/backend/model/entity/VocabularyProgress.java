package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.VocabularyMasteryLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Per-user, per-vocabulary-item learning state, modeled on ExpressionProgress but scoped down to
 * the two axes the smaller vocabulary practice flow actually drives: recallScore (flashcard "I
 * knew it" self-grading) and contextScore (cloze/meaning-match MCQ). See
 * VocabularyPracticeService for the SM-2 scheduling and mastery-transition logic.
 */
@Entity(name = "vocabulary_progress")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "vocabulary_item_id"}))
public class VocabularyProgress {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    private VocabularyItem vocabularyItem;

    @Column(columnDefinition = "double precision default 0")
    private double recallScore;

    @Column(columnDefinition = "double precision default 0")
    private double contextScore;

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
    private VocabularyMasteryLevel masteryLevel = VocabularyMasteryLevel.NEW;

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
