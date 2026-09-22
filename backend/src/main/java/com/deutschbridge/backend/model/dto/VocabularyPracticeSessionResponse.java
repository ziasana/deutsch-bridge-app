package com.deutschbridge.backend.model.dto;

import java.util.List;

public record VocabularyPracticeSessionResponse(
        List<PracticeVocabularyItemDto> items,
        int newCount,
        int reviewCount
) {
}
