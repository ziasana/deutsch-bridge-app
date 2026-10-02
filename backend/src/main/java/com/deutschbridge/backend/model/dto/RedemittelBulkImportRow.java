package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.RedemittelContext;
import com.deutschbridge.backend.model.enums.WritingFormality;

import java.util.List;

/**
 * One row of a Redemittel bulk import. {@code function} is the name (or id) of an existing Funktion;
 * {@code exercises} are optional authored practice exercises. Omitted optional fields use the defaults.
 */
public record RedemittelBulkImportRow(
        LearningLevel level,
        String function,
        String phrase,
        String example,
        String explanation,
        String usageNote,
        WritingFormality formality,
        Integer sortOrder,
        Boolean active,
        String meaningEn,
        String meaningFa,
        String grammarPattern,
        String commonMistake,
        List<String> similarExpressions,
        List<RedemittelContext> contexts,
        List<AdminRedemittelExerciseDto> exercises
) {
}
