package com.deutschbridge.backend.model.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Aggregate payload for the admin "Learner Activity" / "Content & Feature Usage" analytics -
 * everything here is pre-aggregated in the database (see AdminAnalyticsService), never computed
 * from raw rows in the frontend.
 */
public record AdminAnalyticsResponse(
        Period period,
        LearnerActivity learnerActivity,
        List<FeatureUsageEntry> featureUsage
) {

    public record Period(LocalDate from, LocalDate to) {}

    public record LearnerActivity(
            long dailyActiveLearners,
            long weeklyActiveLearners,
            long monthlyActiveLearners,
            long totalActivities,
            List<DailyActivityEntry> daily
    ) {}

    public record DailyActivityEntry(LocalDate date, long activeLearners, long activities) {}

    public record FeatureUsageEntry(
            String module,
            long uniqueLearners,
            long activities,
            double reachPercentage
    ) {}
}
