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
        List<QuizQuestion> quiz,
        List<LearningProgressResponse> learningProgresses
) {
}
