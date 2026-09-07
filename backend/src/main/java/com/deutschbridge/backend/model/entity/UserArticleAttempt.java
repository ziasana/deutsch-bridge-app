package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity(name = "user_article_attempt")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserArticleAttempt {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    private ReadingArticle article;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    private Double comprehensionScore;
    private Double vocabScore;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<QuizAnswerRecord> answers = new ArrayList<>();

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> wordsTapped = new ArrayList<>();

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> wordsSaved = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        if (this.startedAt == null) {
            this.startedAt = LocalDateTime.now();
        }
    }
}
