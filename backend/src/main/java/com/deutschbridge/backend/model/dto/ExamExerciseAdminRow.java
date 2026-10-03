package com.deutschbridge.backend.model.dto;

/** Light row for the admin exam exercise list - no passages or questions; the editor loads the full exercise by id. */
public record ExamExerciseAdminRow(
        String id,
        String title,
        String section,
        String taskType,
        String level,
        Integer partNumber,
        boolean published,
        int questionCount
) {
}
