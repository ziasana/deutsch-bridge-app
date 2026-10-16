package com.deutschbridge.backend.model.dto;

import java.time.LocalDateTime;

/** Light row for the admin exam exercise list - no passages or questions; the editor loads the full exercise by id. */
public record ExamExerciseAdminRow(
        String id,
        String title,
        String section,
        String taskType,
        String level,
        Integer partNumber,
        boolean published,
        int questionCount,
        String examType,
        String status,
        String externalId,
        int version,
        String difficulty,
        LocalDateTime updatedAt,
        /** Imported content only (metadata.topic): the exercise's theme, e.g. "Behörden und Dienstleistungen". */
        String topic,
        /** DTZ directory exercises: DIRECTORY | REGISTER | CATALOGUE | SERVICE_LIST; DTZ texts exercises: the text types, comma-separated. */
        String sourceType,
        LocalDateTime createdAt,
        /** Number of texts / passages of the exercise (DTZ Lesen Teil 3 shows it as "Texts"). */
        int passageCount,
        /** Words in all passages together, markup excluded (DTZ Lesen Teil 4 shows it as "Text length"). */
        int wordCount,
        /** DTZ Mündliche Prüfung Teil 2: true when an image is attached (any other exercise: whether a passage carries one). */
        boolean hasImage
) {
}
