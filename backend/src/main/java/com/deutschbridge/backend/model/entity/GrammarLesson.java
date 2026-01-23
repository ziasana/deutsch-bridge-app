package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.util.List;

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

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<QuizQuestion> quiz;

    public List<QuizQuestion> getQuiz() {
        return quiz;
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}