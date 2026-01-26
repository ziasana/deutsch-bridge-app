package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.time.LocalDateTime;

@EnableJpaAuditing
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
@Entity (name = "learning_progress")
public class LearningProgress {
    @Id
    private String id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference("nomenVerb-progress")
    private NomenVerbConnection nomenVerb;

    @ManyToOne(fetch = FetchType.LAZY)

    private GrammarLesson lesson;

    @ManyToOne(fetch = FetchType.LAZY)

    private User user;

    private Boolean isLearned = false;
    private LocalDateTime learnedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        learnedAt = LocalDateTime.now();
    }
}

