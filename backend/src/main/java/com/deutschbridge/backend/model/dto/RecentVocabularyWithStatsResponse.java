package com.deutschbridge.backend.model.dto;

import java.util.List;

public record RecentVocabularyWithStatsResponse(
        List<RecentVocabularyResponse> recentVocabularyResponse,
        int[] counts
) {
}
