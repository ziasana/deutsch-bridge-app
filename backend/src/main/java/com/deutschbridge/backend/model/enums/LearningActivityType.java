package com.deutschbridge.backend.model.enums;

/**
 * A meaningful learning action, recorded by the backend at the point the action is actually
 * completed (never from a page view/login) - see {@link com.deutschbridge.backend.service.LearningActivityService}.
 */
public enum LearningActivityType {
    DAILY_WORD_COMPLETED,
    VOCABULARY_REVIEW_COMPLETED,
    GRAMMAR_LESSON_COMPLETED,
    GRAMMAR_EXERCISE_COMPLETED,
    READING_COMPLETED,
    LISTENING_COMPLETED,
    EXPRESSION_PRACTICED,
    NOMEN_VERB_EXERCISE_COMPLETED,
    EXAM_EXERCISE_COMPLETED,
    AI_TUTOR_MESSAGE
}
