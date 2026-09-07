package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.AnnotationType;
import com.deutschbridge.backend.model.enums.WordProgressStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * The user's personal lexicon - one row per (user, lemma). Built from words/phrases tapped and
 * saved while reading, and fed back into quiz scoring.
 */
@Entity(name = "user_word_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserWordProgress {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    private String lemma;

    @Enumerated(EnumType.STRING)
    private AnnotationType type;

    @Enumerated(EnumType.STRING)
    private WordProgressStatus status = WordProgressStatus.NEW;

    private String firstSeenArticleId;

    @Column(columnDefinition = "TEXT")
    private String firstSeenSentence;

    /** Captured from the annotation at save time - needed for the SRS flashcard back (spec section 6). */
    private String translation;

    private int timesSeen;
    private int timesCorrectInQuiz;
    private int timesIncorrectInQuiz;

    private LocalDateTime savedAt;
    private LocalDateTime lastReviewedAt;

    // SM-2 spaced-repetition scheduling (spec section 6). Explicit column defaults so
    // ddl-auto=update can add these NOT NULL columns to a table that already has rows.
    private LocalDateTime srsDueAt;

    @Column(columnDefinition = "integer default 0")
    private int srsInterval;

    @Column(columnDefinition = "double precision default 2.5")
    private double srsEaseFactor = 2.5;

    @Column(columnDefinition = "integer default 0")
    private int srsRepetitions;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        if (this.savedAt == null) {
            this.savedAt = LocalDateTime.now();
        }
        if (this.srsDueAt == null) {
            this.srsDueAt = this.savedAt;
        }
    }
}
