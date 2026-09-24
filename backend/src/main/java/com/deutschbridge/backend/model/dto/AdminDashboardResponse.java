package com.deutschbridge.backend.model.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Aggregate payload for the admin dashboard - one call, read-only, no business logic in the frontend. */
public record AdminDashboardResponse(
        OverviewResponse overview,
        List<AttentionItemResponse> attention,
        UserActivityResponse userActivity,
        ContentOverviewResponse contentOverview,
        List<LearningActivityItemResponse> learningActivity,
        List<RecentActivityResponse> recentActivity
) {

    public record OverviewResponse(
            UsersOverview users,
            ContentSummaryOverview content,
            PremiumOverview premium,
            AiOverview ai
    ) {}

    public record UsersOverview(long total, long newToday) {}

    public record ContentSummaryOverview(long total, long newThisWeek) {}

    public record PremiumOverview(long premiumUsers, long totalUsers, double percentage) {}

    public record AiOverview(long requestsToday, double usagePercentToday) {}

    public record AttentionItemResponse(
            String id,
            String type,
            String title,
            long count,
            String description,
            String href,
            String priority
    ) {}

    public record UserActivityResponse(
            long today,
            long thisWeek,
            long thisMonth,
            List<DailyActivityPoint> series
    ) {}

    public record DailyActivityPoint(LocalDate date, long activeUsers) {}

    public record ContentOverviewResponse(
            long grammar,
            long expressions,
            long reading,
            long examExercises,
            long dailyWords
    ) {}

    public record LearningActivityItemResponse(String key, String label, long value) {}

    public record RecentActivityResponse(
            String id,
            String type,
            String title,
            String description,
            Instant createdAt,
            String href
    ) {}
}
