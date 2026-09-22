package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.QuizQuestion;

import java.util.List;

public record GrammarLessonResponse(
        String id,
        String title,
        String summary,
        String content,
        String level,
        String example,
        String usageTips,
        String titleFa,
        String summaryFa,
        String contentFa,
        String exampleFa,
        String usageTipsFa,
        String videoLink,
        String status,
        List<QuizQuestion> quiz,
        List<LearningProgressResponse> learningProgresses,
        java.time.LocalDateTime createdAt,
        java.time.LocalDateTime updatedAt,
        String categoryId,
        String categoryTitle,
        Integer sortOrder
) {
}
