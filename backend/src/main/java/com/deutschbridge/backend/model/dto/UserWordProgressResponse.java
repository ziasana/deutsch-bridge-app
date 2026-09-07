package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.AnnotationType;
import com.deutschbridge.backend.model.enums.WordProgressStatus;

import java.time.LocalDateTime;

public record UserWordProgressResponse(
        String id,
        String lemma,
        AnnotationType type,
        WordProgressStatus status,
        String firstSeenSentence,
        String translation,
        int timesSeen,
        LocalDateTime savedAt,
        LocalDateTime srsDueAt
) {
}
