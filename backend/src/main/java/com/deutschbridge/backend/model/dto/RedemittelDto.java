package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.RedemittelContext;
import com.deutschbridge.backend.model.enums.RedemittelStatus;
import com.deutschbridge.backend.model.enums.WritingFormality;

import java.time.LocalDateTime;
import java.util.List;

/**
 * A Redemittel as the learner sees it: the shared record plus the caller's own progress and
 * collection state. Optional fields are null/empty when the admin has not authored them, so the
 * UI can simply skip those sections.
 */
public record RedemittelDto(
        String id,
        LearningLevel level,
        String category,
        String categoryLabel,
        String phrase,
        /** Gloss in the learner's language, falling back to the German explanation. */
        String meaning,
        String explanation,
        String example,
        WritingFormality formality,
        String usageNote,
        String grammarPattern,
        String commonMistake,
        List<String> similarExpressions,
        List<RedemittelContext> contexts,
        RedemittelStatus status,
        LocalDateTime nextReviewAt,
        boolean saved
) {
}
