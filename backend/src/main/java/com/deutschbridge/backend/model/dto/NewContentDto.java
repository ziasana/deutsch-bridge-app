package com.deutschbridge.backend.model.dto;

/** Counts of published content added since the user's last active day - null (the whole
 * DashboardResponse.newContent field) when there's no last-active date yet or nothing is new. */
public record NewContentDto(
        int grammarLessons,
        int readingArticles,
        int expressions,
        int total
) {
}
