package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "daily_words")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyWord {
    @Id
    private String id;

    @Column(nullable = false)
    private String word;

    @Column(columnDefinition = "TEXT")
    private String meaning;

    @Column(columnDefinition = "TEXT")
    private String example;

    private String synonyms;

    @Enumerated(EnumType.STRING)
    private LearningLevel level;

    /** Persian translation of {@link #meaning} - only populated for A1-A2 words, and only ever
     *  exposed to a user whose profile preferredLanguage is PR (see DailyWordService). */
    @Column(columnDefinition = "TEXT")
    private String meaningFa;

    /** Persian translation of {@link #example} - same gating as {@link #meaningFa}. */
    @Column(columnDefinition = "TEXT")
    private String exampleFa;

    /** Null for the shared seed/fallback pool. Set when this word was AI-generated specifically
     *  for one user's "today's words" (see DailyWordService.generateForUser). */
    @ManyToOne(fetch = FetchType.LAZY)
    private User assignedTo;

    /** The calendar day this word was assigned as part of assignedTo's daily set. Null for the
     *  shared seed/fallback pool. */
    private LocalDate assignedDate;

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}
