package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.WritingFormality;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** A Redemittel: a reusable expression, organized by communicative function and level. */
@Entity(name = "writingPhrases")
@Table(indexes = @Index(columnList = "level, category"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WritingPhrase {
    @Id
    private String id;

    @Enumerated(EnumType.STRING)
    private LearningLevel level;

    /** Eager: cached phrases are read outside a transaction. */
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "category")
    private RedemittelFunction category;

    @Column(length = 1000)
    private String phrase;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(columnDefinition = "TEXT")
    private String example;

    @Enumerated(EnumType.STRING)
    private WritingFormality formality;

    @Column(columnDefinition = "TEXT")
    private String usageNote;

    /** Learner-facing English / Persian gloss; the German `explanation` is the fallback. */
    @Column(columnDefinition = "TEXT")
    private String meaningEn;

    @Column(columnDefinition = "TEXT")
    private String meaningFa;

    /** Grammar / structure, e.g. "Ich bin der Meinung, dass + Nebensatz". */
    @Column(columnDefinition = "TEXT")
    private String grammarPattern;

    @Column(columnDefinition = "TEXT")
    private String commonMistake;

    /** One similar expression per line. */
    @Column(columnDefinition = "TEXT")
    private String similarExpressions;

    /** Comma-separated {@link com.deutschbridge.backend.model.enums.RedemittelContext} names. */
    private String contexts;

    private int sortOrder;
    private boolean active = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
