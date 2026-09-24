package com.deutschbridge.backend.model.dto;

/**
 * Lightweight, student-facing shape for exercise lists/navigation (section tabs, level selector,
 * Teil listings) - unlike ExamExercisePublicResponse, this never carries passages/questions/
 * answerOptions, so browsing and progress views stay cheap no matter how large exam_exercises
 * grows. Full content is only ever fetched per-exercise via GET /api/exam/{id}.
 */
public record ExamExerciseSummaryResponse(
        String id,
        String title,
        String section,
        String taskType,
        String level,
        Integer partNumber,
        /** Shown inline for informational (level-agnostic) entries like Testformat Information. */
        String teilDescription,
        int questionsCount,
        boolean completed,
        /** Percentage (0-100) from the most recent completed attempt, or null if never attempted. */
        Double lastScore
) {
}
