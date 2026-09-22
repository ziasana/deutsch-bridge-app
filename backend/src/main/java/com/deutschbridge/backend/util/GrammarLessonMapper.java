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
                lesson.getTitleFa(),
                lesson.getSummaryFa(),
                lesson.getContentFa(),
                lesson.getExampleFa(),
                lesson.getUsageTipsFa(),
                lesson.getVideoLink(),
                lesson.getStatus() != null ? lesson.getStatus().name() : null,
                lesson.getQuiz(),
                userProgress != null
                        ? List.of(new LearningProgressResponse(userProgress.getId(), Boolean.TRUE.equals(userProgress.getIsLearned())))
                        : List.of(),
                lesson.getCreatedAt(),
                lesson.getUpdatedAt(),
                lesson.getCategory() != null ? lesson.getCategory().getId() : null,
                lesson.getCategory() != null ? lesson.getCategory().getTitle() : null,
                lesson.getSortOrder()
        );
    }

    /** Admin views don't need per-user progress, and touching the entity's own lazy
     * learningProgresses collection here would trip Jackson over the uninitialized Hibernate proxy. */
    public static GrammarLessonResponse mapToAdminResponse(GrammarLesson lesson) {
        return mapToResponse(lesson, null);
    }
}
