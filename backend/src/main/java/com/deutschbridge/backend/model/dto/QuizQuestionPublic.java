package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.ReadingQuizQuestionType;

import java.util.List;

/**
 * Quiz question shape sent to the client before it is answered - never carries the
 * correct answer, explanation, or supporting sentence.
 */
public record QuizQuestionPublic(
        String id,
        ReadingQuizQuestionType type,
        String prompt,
        List<String> options
) {
}
