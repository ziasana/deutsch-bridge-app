package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.GrammarLessonStatus;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Entity(name = "grammarLessons")
@Data
@NoArgsConstructor
@AllArgsConstructor

public class GrammarLesson{
    @Id
    private String id;
    private String title;
    private @Column(columnDefinition = "TEXT") String summary;
    private @Column(columnDefinition = "TEXT") String content;
    private LearningLevel level;
    private @Column(columnDefinition = "TEXT") String example;
    private @Column(columnDefinition = "TEXT") String usageTips;

    /**
     * Persian translations of the fields above - only authored/shown for levels A1-B1
     * (see GrammarLessonMapper/frontend language toggle). Null for B2+ lessons, which are
     * single-language only.
     */
    private @Column(columnDefinition = "TEXT") String titleFa;
    private @Column(columnDefinition = "TEXT") String summaryFa;
    private @Column(columnDefinition = "TEXT") String contentFa;
    private @Column(columnDefinition = "TEXT") String exampleFa;
    private @Column(columnDefinition = "TEXT") String usageTipsFa;

    /** Optional link to an external explainer video (e.g. YouTube) - null if none. */
    private @Column(columnDefinition = "TEXT") String videoLink;

    @Enumerated(EnumType.STRING)
    private GrammarLessonStatus status = GrammarLessonStatus.DRAFT;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<QuizQuestion> quiz;

    @OneToMany(mappedBy = "lesson")
    @JsonManagedReference("lesson-progress")
    private Set<LearningProgress> learningProgresses;

    /** Which curriculum block this lesson belongs to - null if not yet assigned. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @JsonBackReference("category-lessons")
    private GrammarCategory category;

    /** Position of this lesson among its category's other lessons - lower values come first. */
    private Integer sortOrder = 0;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        if (this.status == null) {
            this.status = GrammarLessonStatus.DRAFT;
        }
        if (this.sortOrder == null) {
            this.sortOrder = 0;
        }
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}