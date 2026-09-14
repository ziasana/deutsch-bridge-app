package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.QuizQuestion;
import com.deutschbridge.backend.model.enums.GrammarLessonStatus;
import com.deutschbridge.backend.model.enums.LearningLevel;

import java.util.List;

public record GrammarLessonManualRequest(
        String title,
        LearningLevel level,
        String summary,
        String content,
        String example,
        String usageTips,
        String titleFa,
        String summaryFa,
        String contentFa,
        String exampleFa,
        String usageTipsFa,
        String videoLink,
        GrammarLessonStatus status,
        List<QuizQuestion> quiz
) {
}
