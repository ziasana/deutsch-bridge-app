package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Groups a level's lessons into a curriculum block (e.g. "Block 1: Erste Saetze"), matching the
 * Level -> Category -> Lessons hierarchy of the admin-authored curriculum. Also carries the
 * pass threshold for this category's aggregate test (see GrammarCategoryTestAttempt).
 */
@Entity(name = "grammarCategories")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrammarCategory {
    @Id
    private String id;
    private String title;
    private @Column(columnDefinition = "TEXT") String titleFa;

    @Enumerated(EnumType.STRING)
    private LearningLevel level;

    private int sortOrder = 0;

    /** Minimum percentage score (0-100) on the category test required to mark it complete. */
    private int passThreshold = 70;

    @OneToMany(mappedBy = "category")
    @JsonManagedReference("category-lessons")
    private Set<GrammarLesson> lessons;

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
