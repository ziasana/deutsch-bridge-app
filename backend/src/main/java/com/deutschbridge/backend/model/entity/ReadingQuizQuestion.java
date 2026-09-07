package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.ReadingQuizQuestionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadingQuizQuestion {
    private String id;
    private ReadingQuizQuestionType type;
    private String prompt;
    private List<String> options;
    private String correctAnswer;
    private String relatedAnnotationId;
    private String explanation;
    private String supportingSentence;
    private LearningLevel minLevel;

    public ReadingQuizQuestion ensureId() {
        if (this.id == null || this.id.isBlank()) {
            this.id = NanoIdUtils.randomNanoId();
        }
        return this;
    }
}
