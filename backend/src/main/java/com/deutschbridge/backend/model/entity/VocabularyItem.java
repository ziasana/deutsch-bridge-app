package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.VocabularySource;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A unified per-user vocabulary entry - either a CUSTOM word the learner typed in themselves, or a
 * DICTIONARY word saved from the click-to-define panel (see DictionaryEntry). Replaces the old
 * Vocabulary + VocabularyContent + UserVocab split: one row per (user, word, language), so a word
 * with meanings in multiple languages becomes separate rows instead of a nested content
 * collection (see VocabularyMigrationRunner for how existing data is folded into this shape).
 */
@Entity(name = "vocabulary_items")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "word", "language"}))
public class VocabularyItem {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @Enumerated(EnumType.STRING)
    private VocabularySource source;

    @Column(nullable = false)
    private String word;

    /** German grammatical article for nouns: "der"/"die"/"das". Null for non-nouns. */
    private String article;

    @Column(columnDefinition = "TEXT")
    private String meaning;

    private String language;

    @Column(columnDefinition = "TEXT")
    private String example;

    @Column(columnDefinition = "TEXT")
    private String synonyms;

    @Enumerated(EnumType.STRING)
    private LearningLevel level;

    @Column(columnDefinition = "TEXT")
    private String audioUrl;

    /** Only set for source=DICTIONARY - links back to the shared headword row. DictionaryEntry
     *  itself stays untouched, this is purely a reference. */
    @ManyToOne(fetch = FetchType.LAZY)
    private DictionaryEntry dictionaryEntry;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        this.createdAt = LocalDateTime.now();
    }
}
