package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.AdminDashboardResponse;
import com.deutschbridge.backend.model.dto.AdminDashboardResponse.AiOverview;
import com.deutschbridge.backend.model.dto.AdminDashboardResponse.AttentionItemResponse;
import com.deutschbridge.backend.model.dto.AdminDashboardResponse.ContentOverviewResponse;
import com.deutschbridge.backend.model.dto.AdminDashboardResponse.ContentSummaryOverview;
import com.deutschbridge.backend.model.dto.AdminDashboardResponse.DailyActivityPoint;
import com.deutschbridge.backend.model.dto.AdminDashboardResponse.LearningActivityItemResponse;
import com.deutschbridge.backend.model.dto.AdminDashboardResponse.OverviewResponse;
import com.deutschbridge.backend.model.dto.AdminDashboardResponse.PremiumOverview;
import com.deutschbridge.backend.model.dto.AdminDashboardResponse.RecentActivityResponse;
import com.deutschbridge.backend.model.dto.AdminDashboardResponse.UserActivityResponse;
import com.deutschbridge.backend.model.dto.AdminDashboardResponse.UsersOverview;
import com.deutschbridge.backend.model.entity.AdminAuditLog;
import com.deutschbridge.backend.model.entity.FeatureLimit;
import com.deutschbridge.backend.model.entity.FeatureUsage;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.AccountType;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import com.deutschbridge.backend.model.enums.GrammarLessonStatus;
import com.deutschbridge.backend.model.enums.LearningModule;
import com.deutschbridge.backend.repository.DailyActivityProjection;
import com.deutschbridge.backend.repository.DailyWordRepository;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import com.deutschbridge.backend.repository.ExpressionRepository;
import com.deutschbridge.backend.repository.FeatureUsageRepository;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import com.deutschbridge.backend.repository.LearningActivityRepository;
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import com.deutschbridge.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Aggregates existing admin/content/usage data into one read-only payload for the admin
 * dashboard. Deliberately reuses the repositories/entities already backing the individual admin
 * pages instead of introducing a parallel tracking system - see the class-level note on each
 * section below for what real data backs it and what's intentionally left out.
 */
@Service
public class AdminDashboardService {

    private static final int ATTENTION_LIMIT = 6;
    private static final int RECENT_ACTIVITY_LIMIT = 10;
    private static final int ACTIVITY_SERIES_DAYS = 7;
    private static final int LEARNING_ACTIVITY_WINDOW_DAYS = 7;

    private final UserRepository userRepository;
    private final ExpressionRepository expressionRepository;
    private final GrammarLessonRepository grammarLessonRepository;
    private final ReadingArticleRepository readingArticleRepository;
    private final ExamExerciseRepository examExerciseRepository;
    private final DailyWordRepository dailyWordRepository;
    private final FeatureUsageRepository featureUsageRepository;
    private final FeatureLimitService featureLimitService;
    private final LearningActivityRepository learningActivityRepository;
    private final AdminAuditLogService adminAuditLogService;

    public AdminDashboardService(UserRepository userRepository,
                                  ExpressionRepository expressionRepository,
                                  GrammarLessonRepository grammarLessonRepository,
                                  ReadingArticleRepository readingArticleRepository,
                                  ExamExerciseRepository examExerciseRepository,
                                  DailyWordRepository dailyWordRepository,
                                  FeatureUsageRepository featureUsageRepository,
                                  FeatureLimitService featureLimitService,
                                  LearningActivityRepository learningActivityRepository,
                                  AdminAuditLogService adminAuditLogService) {
        this.userRepository = userRepository;
        this.expressionRepository = expressionRepository;
        this.grammarLessonRepository = grammarLessonRepository;
        this.readingArticleRepository = readingArticleRepository;
        this.examExerciseRepository = examExerciseRepository;
        this.dailyWordRepository = dailyWordRepository;
        this.featureUsageRepository = featureUsageRepository;
        this.featureLimitService = featureLimitService;
        this.learningActivityRepository = learningActivityRepository;
        this.adminAuditLogService = adminAuditLogService;
    }

    public AdminDashboardResponse build() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfToday = LocalDateTime.of(today, LocalTime.MIDNIGHT);
        LocalDateTime weekAgo = startOfToday.minusDays(7);
        Instant todayInstant = startOfToday.toInstant(ZoneOffset.UTC);

        long draftExpressions = expressionRepository.countByStatus(ExpressionStatus.DRAFT);
        long draftGrammarLessons = grammarLessonRepository.countByStatus(GrammarLessonStatus.DRAFT);
        long unpublishedExamExercises = examExerciseRepository.countByPublished(false);

        long publishedGrammar = grammarLessonRepository.countByStatus(GrammarLessonStatus.PUBLISHED);
        long publishedExpressions = expressionRepository.countByStatus(ExpressionStatus.PUBLISHED);
        long readingTotal = readingArticleRepository.count();
        long publishedExamExercises = examExerciseRepository.countByPublished(true);
        long dailyWordsTotal = dailyWordRepository.count();
        long contentTotal = publishedGrammar + publishedExpressions + readingTotal + publishedExamExercises + dailyWordsTotal;

        long contentNewThisWeek = grammarLessonRepository.countByStatusAndCreatedAtAfter(GrammarLessonStatus.PUBLISHED, weekAgo)
                + expressionRepository.countByStatusAndCreatedAtAfter(ExpressionStatus.PUBLISHED, weekAgo)
                + readingArticleRepository.countByCreatedAtAfter(weekAgo);

        long totalUsers = userRepository.countByDeletedFalse();
        long newUsersToday = userRepository.countByDeletedFalseAndCreatedAtAfter(todayInstant);
        long premiumUsers = userRepository.countByDeletedFalseAndAccountType(AccountType.PREMIUM);
        long basicUsers = userRepository.countByDeletedFalseAndAccountType(AccountType.BASIC);
        double premiumPercentage = totalUsers == 0 ? 0 : (premiumUsers * 100.0) / totalUsers;

        AiOverview aiOverview = buildAiOverview(today, basicUsers, premiumUsers);
        long usersHitAiLimit = countUsersHitAiLimit(today);

        OverviewResponse overview = new OverviewResponse(
                new UsersOverview(totalUsers, newUsersToday),
                new ContentSummaryOverview(contentTotal, contentNewThisWeek),
                new PremiumOverview(premiumUsers, totalUsers, premiumPercentage),
                aiOverview
        );

        List<AttentionItemResponse> attention = buildAttentionItems(
                draftExpressions, draftGrammarLessons, unpublishedExamExercises, usersHitAiLimit
        );

        UserActivityResponse userActivity = buildUserActivity(today);

        ContentOverviewResponse contentOverview = new ContentOverviewResponse(
                publishedGrammar, publishedExpressions, readingTotal, publishedExamExercises, dailyWordsTotal
        );

        List<LearningActivityItemResponse> learningActivity = buildLearningActivity(today);

        List<RecentActivityResponse> recentActivity = buildRecentActivity();

        return new AdminDashboardResponse(overview, attention, userActivity, contentOverview, learningActivity, recentActivity);
    }

    /** Today's AI request volume against the daily capacity of every enabled feature/plan, so the
     * percentage reflects real limits instead of an arbitrary denominator. */
    private AiOverview buildAiOverview(LocalDate today, long basicUsers, long premiumUsers) {
        long requestsToday = featureUsageRepository.sumCountByUsageDate(today);

        long capacity = 0;
        for (FeatureLimit limit : featureLimitService.findAll()) {
            if (!limit.isEnabled()) continue;
            long usersOnPlan = limit.getAccountType() == AccountType.PREMIUM ? premiumUsers : basicUsers;
            capacity += (long) limit.getDailyLimit() * usersOnPlan;
        }

        double usagePercent = capacity == 0 ? 0 : Math.min(100.0, (requestsToday * 100.0) / capacity);
        return new AiOverview(requestsToday, usagePercent);
    }

    /** Distinct users whose usage of any enabled feature today reached that feature's limit for
     * their plan - computed from the same {@link FeatureUsage} rows the feature gate itself checks. */
    private long countUsersHitAiLimit(LocalDate today) {
        List<FeatureUsage> usagesToday = featureUsageRepository.findByUsageDate(today);
        if (usagesToday.isEmpty()) return 0;

        Map<String, AccountType> accountTypeByUserId = new HashMap<>();
        for (User user : userRepository.findAllByDeletedFalse()) {
            accountTypeByUserId.put(user.getId(), user.getAccountType() == null ? AccountType.BASIC : user.getAccountType());
        }

        java.util.Set<String> usersAtLimit = new java.util.HashSet<>();
        for (FeatureUsage usage : usagesToday) {
            AccountType accountType = accountTypeByUserId.get(usage.getUserId());
            if (accountType == null) continue;
            FeatureLimit limit = featureLimitService.get(usage.getFeatureType(), accountType);
            if (limit.isEnabled() && usage.getCount() >= limit.getDailyLimit()) {
                usersAtLimit.add(usage.getUserId());
            }
        }
        return usersAtLimit.size();
    }

    private List<AttentionItemResponse> buildAttentionItems(long draftExpressions, long draftGrammarLessons,
                                                              long unpublishedExamExercises, long usersHitAiLimit) {
        List<AttentionItemResponse> items = new ArrayList<>();

        if (usersHitAiLimit > 0) {
            items.add(new AttentionItemResponse("ai-limit", "ai", "Users reached their AI limit",
                    usersHitAiLimit, "Hit their daily AI usage limit today", "/admin/settings", "high"));
        }
        if (draftExpressions > 0) {
            items.add(new AttentionItemResponse("draft-expressions", "content", "Draft expressions",
                    draftExpressions, "Awaiting review before publishing", "/admin/expressionsSection", "medium"));
        }
        if (draftGrammarLessons > 0) {
            items.add(new AttentionItemResponse("draft-grammar", "content", "Draft grammar lessons",
                    draftGrammarLessons, "Awaiting review before publishing", "/admin/grammar", "medium"));
        }
        if (unpublishedExamExercises > 0) {
            items.add(new AttentionItemResponse("unpublished-exam-exercises", "content", "Unpublished exam exercises",
                    unpublishedExamExercises, "Hidden from learners until published", "/admin/exam-prep/testformat-information", "low"));
        }

        items.sort(Comparator.comparingInt(item -> priorityRank(item.priority())));
        return items.stream().limit(ATTENTION_LIMIT).toList();
    }

    private int priorityRank(String priority) {
        return switch (priority) {
            case "high" -> 0;
            case "medium" -> 1;
            default -> 2;
        };
    }

    /** Active-learner counts sourced from the real {@link LearningActivityRepository} event log
     * (a user is "active" on a day they completed any meaningful learning action - see
     * {@link LearningActivityService}), not the unwired legacy daily-practice counters. */
    private UserActivityResponse buildUserActivity(LocalDate today) {
        LocalDateTime startOfToday = LocalDateTime.of(today, LocalTime.MIDNIGHT);
        LocalDateTime endOfToday = LocalDateTime.of(today, LocalTime.MAX);
        long activeToday = learningActivityRepository.countDistinctUserIdByCreatedAtBetween(startOfToday, endOfToday);
        long activeThisWeek = learningActivityRepository.countDistinctUserIdByCreatedAtBetween(
                LocalDateTime.of(today.minusDays(6), LocalTime.MIDNIGHT), endOfToday);
        long activeThisMonth = learningActivityRepository.countDistinctUserIdByCreatedAtBetween(
                LocalDateTime.of(today.minusDays(29), LocalTime.MIDNIGHT), endOfToday);

        LocalDate seriesStart = today.minusDays(ACTIVITY_SERIES_DAYS - 1L);
        Map<LocalDate, Long> byDate = new HashMap<>();
        for (DailyActivityProjection row : learningActivityRepository.dailySeries(
                LocalDateTime.of(seriesStart, LocalTime.MIDNIGHT), endOfToday)) {
            byDate.put(row.getDay(), row.getActiveLearners());
        }

        List<DailyActivityPoint> series = new ArrayList<>();
        for (LocalDate d = seriesStart; !d.isAfter(today); d = d.plusDays(1)) {
            series.add(new DailyActivityPoint(d, byDate.getOrDefault(d, 0L)));
        }

        return new UserActivityResponse(activeToday, activeThisWeek, activeThisMonth, series);
    }

    /** Real per-module activity counts over the last week, from the same event log - modules with
     * no tracked completion yet (e.g. Nomen-Verb) show honestly as zero rather than being omitted
     * or faked. */
    private List<LearningActivityItemResponse> buildLearningActivity(LocalDate today) {
        LocalDateTime start = LocalDateTime.of(today.minusDays(LEARNING_ACTIVITY_WINDOW_DAYS - 1L), LocalTime.MIDNIGHT);
        LocalDateTime end = LocalDateTime.of(today, LocalTime.MAX);

        List<LearningActivityItemResponse> items = new ArrayList<>();
        items.add(new LearningActivityItemResponse("daily_words", "Daily Words",
                learningActivityRepository.countByModuleAndCreatedAtBetween(LearningModule.DAILY_WORDS, start, end)));
        items.add(new LearningActivityItemResponse("vocabulary", "Vocabulary",
                learningActivityRepository.countByModuleAndCreatedAtBetween(LearningModule.VOCABULARY, start, end)));
        items.add(new LearningActivityItemResponse("grammar", "Grammar",
                learningActivityRepository.countByModuleAndCreatedAtBetween(LearningModule.GRAMMAR, start, end)));
        items.add(new LearningActivityItemResponse("reading", "Reading",
                learningActivityRepository.countByModuleAndCreatedAtBetween(LearningModule.READING, start, end)));
        items.add(new LearningActivityItemResponse("ai_tutor", "AI Tutor",
                learningActivityRepository.countByModuleAndCreatedAtBetween(LearningModule.AI_TUTOR, start, end)));
        return items;
    }

    /** Reuses the existing admin-action audit trail (see {@link AdminAuditLogService}) rather than
     * introducing a separate end-user activity feed. */
    private List<RecentActivityResponse> buildRecentActivity() {
        return adminAuditLogService.findRecent().stream()
                .limit(RECENT_ACTIVITY_LIMIT)
                .map(this::toRecentActivity)
                .toList();
    }

    private RecentActivityResponse toRecentActivity(AdminAuditLog log) {
        return new RecentActivityResponse(
                log.getId(),
                "admin",
                humanizeAction(log.getAction()),
                log.getDetails(),
                log.getCreatedAt(),
                "/admin/settings"
        );
    }

    private String humanizeAction(String action) {
        if (action == null || action.isBlank()) return "Admin action";
        String[] parts = action.toLowerCase().split("_");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (parts[i].isEmpty()) continue;
            if (i > 0) sb.append(' ');
            sb.append(Character.toUpperCase(parts[i].charAt(0))).append(parts[i].substring(1));
        }
        return sb.toString();
    }
}
