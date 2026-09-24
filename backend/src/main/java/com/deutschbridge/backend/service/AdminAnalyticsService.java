package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.AdminAnalyticsResponse;
import com.deutschbridge.backend.model.dto.AdminAnalyticsResponse.DailyActivityEntry;
import com.deutschbridge.backend.model.dto.AdminAnalyticsResponse.FeatureUsageEntry;
import com.deutschbridge.backend.model.dto.AdminAnalyticsResponse.LearnerActivity;
import com.deutschbridge.backend.model.dto.AdminAnalyticsResponse.Period;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.DailyActivityProjection;
import com.deutschbridge.backend.repository.LearningActivityRepository;
import com.deutschbridge.backend.repository.ModuleUsageProjection;
import com.deutschbridge.backend.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Aggregates {@link com.deutschbridge.backend.model.entity.LearningActivity} rows into the admin
 * "Learner Activity" (are people learning?) and "Content & Feature Usage" (what are they using?)
 * sections - all aggregation happens here in SQL/JPQL, never over raw rows in the frontend.
 */
@Service
public class AdminAnalyticsService {

    private static final int DEFAULT_RANGE_DAYS = 30;

    private final LearningActivityRepository learningActivityRepository;
    private final UserProfileRepository userProfileRepository;

    public AdminAnalyticsService(LearningActivityRepository learningActivityRepository,
                                  UserProfileRepository userProfileRepository) {
        this.learningActivityRepository = learningActivityRepository;
        this.userProfileRepository = userProfileRepository;
    }

    public AdminAnalyticsResponse build(String range, String level) {
        int rangeDays = parseRangeDays(range);
        LocalDate today = LocalDate.now();
        LocalDate periodStart = today.minusDays(rangeDays - 1L);

        LocalDateTime periodStartAt = LocalDateTime.of(periodStart, LocalTime.MIDNIGHT);
        LocalDateTime periodEndAt = LocalDateTime.of(today, LocalTime.MAX);
        LocalDateTime startOfToday = LocalDateTime.of(today, LocalTime.MIDNIGHT);

        long dailyActiveLearners = learningActivityRepository.countDistinctUserIdByCreatedAtBetween(startOfToday, periodEndAt);
        long weeklyActiveLearners = learningActivityRepository.countDistinctUserIdByCreatedAtBetween(
                LocalDateTime.of(today.minusDays(6), LocalTime.MIDNIGHT), periodEndAt);
        long monthlyActiveLearners = learningActivityRepository.countDistinctUserIdByCreatedAtBetween(
                LocalDateTime.of(today.minusDays(29), LocalTime.MIDNIGHT), periodEndAt);
        long totalActivities = learningActivityRepository.countByCreatedAtBetween(periodStartAt, periodEndAt);

        List<DailyActivityEntry> daily = buildDailySeries(periodStart, today, periodStartAt, periodEndAt);

        LearnerActivity learnerActivity = new LearnerActivity(
                dailyActiveLearners, weeklyActiveLearners, monthlyActiveLearners, totalActivities, daily
        );

        List<FeatureUsageEntry> featureUsage = buildFeatureUsage(periodStartAt, periodEndAt, level);

        return new AdminAnalyticsResponse(new Period(periodStart, today), learnerActivity, featureUsage);
    }

    private List<DailyActivityEntry> buildDailySeries(LocalDate start, LocalDate end,
                                                        LocalDateTime startAt, LocalDateTime endAt) {
        Map<LocalDate, DailyActivityProjection> byDay = new HashMap<>();
        for (DailyActivityProjection row : learningActivityRepository.dailySeries(startAt, endAt)) {
            byDay.put(row.getDay(), row);
        }

        List<DailyActivityEntry> series = new ArrayList<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            DailyActivityProjection row = byDay.get(d);
            series.add(new DailyActivityEntry(d, row == null ? 0 : row.getActiveLearners(), row == null ? 0 : row.getActivities()));
        }
        return series;
    }

    private List<FeatureUsageEntry> buildFeatureUsage(LocalDateTime startAt, LocalDateTime endAt, String level) {
        boolean hasLevelFilter = level != null && !level.isBlank() && !"ALL".equalsIgnoreCase(level);

        if (!hasLevelFilter) {
            long totalActiveLearners = learningActivityRepository.countDistinctUserIdByCreatedAtBetween(startAt, endAt);
            List<ModuleUsageProjection> rows = learningActivityRepository.moduleUsage(startAt, endAt);
            return toFeatureUsageEntries(rows, totalActiveLearners);
        }

        LearningLevel parsedLevel = LearningLevel.valueOf(level.toUpperCase());
        List<String> userIds = userProfileRepository.findUserIdsByLearningLevel(parsedLevel);
        if (userIds.isEmpty()) {
            return List.of();
        }

        long totalActiveLearners = learningActivityRepository.countDistinctUserIdByCreatedAtBetweenAndUserIdIn(startAt, endAt, userIds);
        List<ModuleUsageProjection> rows = learningActivityRepository.moduleUsageForUsers(startAt, endAt, userIds);
        return toFeatureUsageEntries(rows, totalActiveLearners);
    }

    private List<FeatureUsageEntry> toFeatureUsageEntries(List<ModuleUsageProjection> rows, long totalActiveLearners) {
        return rows.stream()
                .map(row -> new FeatureUsageEntry(
                        row.getModule().name(),
                        row.getUniqueLearners(),
                        row.getActivities(),
                        totalActiveLearners == 0 ? 0 : Math.min(100.0, (row.getUniqueLearners() * 100.0) / totalActiveLearners)
                ))
                .sorted((a, b) -> Long.compare(b.uniqueLearners(), a.uniqueLearners()))
                .toList();
    }

    private int parseRangeDays(String range) {
        if (range == null) return DEFAULT_RANGE_DAYS;
        return switch (range.trim().toLowerCase()) {
            case "7d" -> 7;
            case "30d" -> 30;
            case "90d" -> 90;
            default -> DEFAULT_RANGE_DAYS;
        };
    }
}
