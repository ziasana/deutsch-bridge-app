package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
@Entity (name = "learning_progress")
public class LearningProgress {
    @Id
    private String id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference("lesson-progress")
    private GrammarLesson lesson;

    @ManyToOne(fetch = FetchType.LAZY)
    private DailyWord dailyWord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference("reading-progress")
    private ReadingArticle reading;

    @ManyToOne(fetch = FetchType.LAZY)

    private User user;

    private Boolean isLearned = false;
    private LocalDateTime learnedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}

