package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.ExamTaskType;

import java.util.List;

/**
 * Question shape sent to the client before it is answered - never carries correctAnswer,
 * matchTargetId, explanation, or commonMistake.
 */
public record ExamQuestionPublic(
        String id,
        ExamTaskType taskType,
        String prompt,
        Integer sectionIndex,
        List<String> options
) {
}
