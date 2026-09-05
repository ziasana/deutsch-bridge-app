package com.deutschbridge.backend.util;

import com.deutschbridge.backend.model.dto.GrammarLessonResponse;
import com.deutschbridge.backend.model.dto.LearningProgressResponse;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.LearningProgress;

import java.util.List;

public class GrammarLessonMapper {
    private GrammarLessonMapper() {
        throw new IllegalStateException("Mapper Utils class");
    }

    /**
     * userProgress must already be scoped to the current authenticated user
     * (see GrammarService) - never pass the entity's own learningProgresses
     * collection here, as it holds every user's progress.
     */
    public static GrammarLessonResponse mapToResponse(GrammarLesson lesson, LearningProgress userProgress) {
        return new GrammarLessonResponse(
                lesson.getId(),
                lesson.getTitle(),
                lesson.getSummary(),
                lesson.getContent(),
                lesson.getLevel() != null ? lesson.getLevel().getValue() : null,
                lesson.getExample(),
                lesson.getUsageTips(),
                lesson.getQuiz(),
                userProgress != null
                        ? List.of(new LearningProgressResponse(userProgress.getId(), Boolean.TRUE.equals(userProgress.getIsLearned())))
                        : List.of()
        );
    }
}
