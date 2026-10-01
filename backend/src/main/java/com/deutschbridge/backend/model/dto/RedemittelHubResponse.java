package com.deutschbridge.backend.model.dto;

import java.util.List;

/** Everything the Redemittel landing page needs, without loading any Redemittel. */
public record RedemittelHubResponse(
        int dueCount,
        /** New Redemittel still to learn today (daily target minus already learned today, limited by availability). */
        int newToday,
        int dailyTarget,
        int learnedToday,
        long savedCount,
        Summary summary,
        List<Category> categories
) {
    /** `learned` is everything the learner has started (learning + review + mastered). */
    public record Summary(long learned, long mastered, long review, long learning, long fresh) {
    }

    public record Category(String key, String label, long count) {
    }
}
