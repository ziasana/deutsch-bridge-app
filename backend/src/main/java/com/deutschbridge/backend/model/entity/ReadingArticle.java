package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
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

@Entity(name = "readingArticles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadingArticle {
    @Id
    private String id;
    private String title;
    private String topic;
    private @Column(columnDefinition = "TEXT") String content;
    private LearningLevel level;

    /** Groups a simplified/authentic pair of the same story (spec 1.1) - null if standalone. */
    private String linkedGroupId;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<KeyVocabularyItem> keyVocabulary;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<Annotation> annotations;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<ReadingQuizQuestion> quiz;

    /** Every word/punctuation token of `content`, precomputed at ingest time (click-to-define). */
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<ArticleTokenItem> tokens;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "reading")
    @JsonManagedReference("reading-progress")
    private Set<LearningProgress> learningProgresses;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
