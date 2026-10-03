package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.WritingGuideKind;

/** Light row for the admin "Schreiben lernen" list - the editor loads the full item by id. */
public record AdminWritingGuideItemRow(
        String id,
        LearningLevel level,
        WritingGuideKind kind,
        String title,
        int sortOrder,
        boolean active
) {
}
