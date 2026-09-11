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

@Entity(name = "exam_attempt")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamAttempt {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    private ExamExercise exercise;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    private Double score;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<ExamAnswerRecord> answers = new ArrayList<>();

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
