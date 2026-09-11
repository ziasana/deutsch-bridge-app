package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;

import java.time.LocalDateTime;
import java.util.List;

/** Admin-facing response - includes answer keys/explanations, never sent to students directly. */
public record ExamExerciseResponse(
        String id,
        String title,
        String section,
        String taskType,
        String level,
        Integer partNumber,
        List<ExamPassage> passages,
        List<ExamQuestion> questions,
        List<String> answerOptions,
        String defaultExplanation,
        String defaultCommonMistake,
        boolean published,
        LocalDateTime createdAt
) {
}
