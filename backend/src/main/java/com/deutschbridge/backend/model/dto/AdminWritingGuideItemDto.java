package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.WritingGuideKind;
import com.fasterxml.jackson.databind.JsonNode;

/** Admin read/write shape of a guide item (the same record is used for requests and responses). */
public record AdminWritingGuideItemDto(
        String id,
        LearningLevel level,
        WritingGuideKind kind,
        String title,
        String content,
        JsonNode data,
        int sortOrder,
        boolean active
) {
}
