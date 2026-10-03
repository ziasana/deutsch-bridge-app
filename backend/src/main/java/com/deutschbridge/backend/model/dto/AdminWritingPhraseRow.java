package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.LearningLevel;

/** Light row for the admin Redemittel list - the editor loads the full phrase by id. */
public record AdminWritingPhraseRow(
        String id,
        LearningLevel level,
        /** Id of the {@code RedemittelFunction}. */
        String category,
        String phrase,
        boolean active,
        int sortOrder,
        long exerciseCount
) {
}
