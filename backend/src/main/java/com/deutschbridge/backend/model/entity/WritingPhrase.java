package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.WritingFormality;
import com.deutschbridge.backend.model.enums.WritingPhraseCategory;
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

    @Enumerated(EnumType.STRING)
    private WritingPhraseCategory category;

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
