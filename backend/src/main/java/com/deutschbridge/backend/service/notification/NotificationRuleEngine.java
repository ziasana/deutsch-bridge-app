package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.dto.TodaysPlanDto;
import com.deutschbridge.backend.model.dto.recommendation.LearningRecommendation;
import com.deutschbridge.backend.model.dto.recommendation.LearningState;
import com.deutschbridge.backend.model.dto.recommendation.RecommendationType;
import com.deutschbridge.backend.model.enums.NotificationPriority;
import com.deutschbridge.backend.model.enums.NotificationType;
import com.deutschbridge.backend.service.LearningRecommendationService;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Turns a learner's LearningState into notification candidates. It only answers "which notifications
 * would be useful right now?" - preferences, quiet hours, limits and dedup are the dispatcher's job.
 *
 * Learning candidates come from LearningRecommendationService's recommendations (the same ones the
 * Dashboard shows), so a notification always points at something the Dashboard would also suggest.
 * Candidates are emitted in the plan's decision order; {@link NotificationCandidate#rank()} records it.
 */
@Component
public class NotificationRuleEngine {

    /** Don't nudge about an unfinished activity the learner only just walked away from. */
    static final Duration CONTINUE_LEARNING_COOLDOWN = Duration.ofHours(2);

    static final String MILESTONE_ROUTE = "/user-progress";
    static final String ENTITY_MILESTONE = "MILESTONE";

    /** Types whose candidates reflect current state, so a missing candidate means the opportunity is resolved. */
    public static final Set<NotificationType> STATE_BASED_TYPES = Set.of(
            NotificationType.REVIEW_DUE,
            NotificationType.DAILY_WORDS_READY,
            NotificationType.DAILY_PLAN_INCOMPLETE,
            NotificationType.CONTINUE_LEARNING
    );

    enum MilestoneMetric {
        WORDS(List.of(10, 50, 100, 250, 500, 1000)),
        GRAMMAR(List.of(10, 25, 50, 100)),
        READING(List.of(10, 25, 50, 100)),
        STREAK(List.of(7, 30, 100, 365));

        final List<Integer> thresholds;

        MilestoneMetric(List<Integer> thresholds) {
            this.thresholds = thresholds;
        }
    }

    /**
     * When and where the learner is: all "today"/"time reached" checks use their local clock.
     * {@code ignoreTimeGates} (admin test mode only) skips the reminder-time and cooldown checks.
     */
    public record RuleContext(Instant now, ZoneId zone, LocalTime preferredReminderTime, boolean ignoreTimeGates) {
        public RuleContext(Instant now, ZoneId zone, LocalTime preferredReminderTime) {
            this(now, zone, preferredReminderTime, false);
        }

        LocalDate localDate() {
            return now.atZone(zone).toLocalDate();
        }

        LocalTime localTime() {
            return now.atZone(zone).toLocalTime();
        }

        Instant endOfLocalDay() {
            return NotificationPolicy.startOfNextLocalDay(now, zone);
        }
    }

    private final LearningRecommendationService recommendationService;

    public NotificationRuleEngine(LearningRecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    public List<NotificationCandidate> evaluate(LearningState state, RuleContext ctx) {
        List<LearningRecommendation> recommendations = recommendationService.getRecommendations(state);
        List<NotificationCandidate> candidates = new ArrayList<>();

        reviewDue(recommendations, ctx, candidates.size()).ifPresent(candidates::add);
        continueLearning(state, recommendations, ctx, candidates.size()).ifPresent(candidates::add);
        dailyPlanIncomplete(state, ctx, candidates.size()).ifPresent(candidates::add);
        dailyWordsReady(recommendations, ctx, candidates.size()).ifPresent(candidates::add);
        for (MilestoneMetric metric : MilestoneMetric.values()) {
            milestone(metric, state, candidates.size()).ifPresent(candidates::add);
        }
        return candidates;
    }

    // Rule 1 - vocabulary review due
    private Optional<NotificationCandidate> reviewDue(List<LearningRecommendation> recs, RuleContext ctx, int rank) {
        return find(recs, RecommendationType.VOCAB_REVIEW).map(rec -> new NotificationCandidate(
                NotificationType.REVIEW_DUE,
                NotificationType.REVIEW_DUE.name(),
                NotificationPriority.HIGH,
                dailyKey(NotificationType.REVIEW_DUE, rec.entityType(), ctx),
                rec.entityType(), null, rec.actionUrl(),
                Map.of("count", String.valueOf(rec.total()), "minutes", String.valueOf(rec.durationMinutes())),
                ctx.endOfLocalDay(),
                rank));
    }

    // Rule 4 - continue an unfinished activity (after a cooldown)
    private Optional<NotificationCandidate> continueLearning(LearningState state, List<LearningRecommendation> recs,
                                                             RuleContext ctx, int rank) {
        if (state.unfinishedActivity() == null || state.unfinishedActivity().startedAt() == null) return Optional.empty();
        if (!ctx.ignoreTimeGates()
                && Duration.between(state.unfinishedActivity().startedAt(), state.now()).compareTo(CONTINUE_LEARNING_COOLDOWN) < 0) {
            return Optional.empty();
        }
        return recs.stream()
                .filter(r -> r.type() == RecommendationType.CONTINUE_READING || r.type() == RecommendationType.CONTINUE_EXAM)
                .findFirst()
                .map(rec -> new NotificationCandidate(
                        NotificationType.CONTINUE_LEARNING,
                        NotificationType.CONTINUE_LEARNING.name()
                                + (rec.type() == RecommendationType.CONTINUE_EXAM ? ".EXAM" : ".READING"),
                        NotificationPriority.HIGH,
                        // No date: one nudge per unfinished activity, not one per day it stays unfinished.
                        NotificationType.CONTINUE_LEARNING.name() + ":" + rec.entityType() + ":" + rec.entityId(),
                        rec.entityType(), rec.entityId(), rec.actionUrl(),
                        Map.of("title", rec.title() != null ? rec.title() : ""),
                        ctx.endOfLocalDay(),
                        rank));
    }

    // Rule 3 - today's plan started but incomplete, once the learner's reminder time has passed
    private Optional<NotificationCandidate> dailyPlanIncomplete(LearningState state, RuleContext ctx, int rank) {
        if (!ctx.ignoreTimeGates()
                && (ctx.preferredReminderTime() == null || ctx.localTime().isBefore(ctx.preferredReminderTime()))) {
            return Optional.empty();
        }
        TodaysPlanDto plan = state.todaysPlan();
        if (!state.planStarted() || plan.completed() >= plan.total()) return Optional.empty();

        return Optional.of(new NotificationCandidate(
                NotificationType.DAILY_PLAN_INCOMPLETE,
                NotificationType.DAILY_PLAN_INCOMPLETE.name(),
                NotificationPriority.HIGH,
                dailyKey(NotificationType.DAILY_PLAN_INCOMPLETE, LearningRecommendationService.ENTITY_DAILY_PLAN, ctx),
                LearningRecommendationService.ENTITY_DAILY_PLAN, null, LearningState.ROUTE_DASHBOARD,
                Map.of("completed", String.valueOf(plan.completed()), "total", String.valueOf(plan.total())),
                ctx.endOfLocalDay(),
                rank));
    }

    // Rule 2 - today's daily words are ready and untouched
    private Optional<NotificationCandidate> dailyWordsReady(List<LearningRecommendation> recs, RuleContext ctx, int rank) {
        return find(recs, RecommendationType.DAILY_WORDS)
                .filter(rec -> rec.completed() == 0)
                .map(rec -> new NotificationCandidate(
                        NotificationType.DAILY_WORDS_READY,
                        NotificationType.DAILY_WORDS_READY.name(),
                        NotificationPriority.MEDIUM,
                        dailyKey(NotificationType.DAILY_WORDS_READY, rec.entityType(), ctx),
                        rec.entityType(), null, rec.actionUrl(),
                        Map.of("count", String.valueOf(rec.total())),
                        ctx.endOfLocalDay(),
                        rank));
    }

    // Rule 5 - milestones: the highest threshold reached per metric, notified once ever
    private Optional<NotificationCandidate> milestone(MilestoneMetric metric, LearningState state, int rank) {
        int value = switch (metric) {
            case WORDS -> state.wordsMastered();
            case GRAMMAR -> state.grammarLearned();
            case READING -> state.readingLearned();
            case STREAK -> state.currentStreakDays();
        };
        Integer reached = null;
        for (int threshold : metric.thresholds) {
            if (value >= threshold) reached = threshold;
        }
        if (reached == null) return Optional.empty();

        String context = metric.name() + ":" + reached;
        return Optional.of(new NotificationCandidate(
                NotificationType.MILESTONE_REACHED,
                NotificationType.MILESTONE_REACHED.name() + "." + metric.name(),
                NotificationPriority.MEDIUM,
                NotificationType.MILESTONE_REACHED.name() + ":" + context,
                ENTITY_MILESTONE, context, MILESTONE_ROUTE,
                Map.of("value", String.valueOf(reached)),
                null,
                rank));
    }

    private static Optional<LearningRecommendation> find(List<LearningRecommendation> recs, RecommendationType type) {
        return recs.stream().filter(r -> r.type() == type).findFirst();
    }

    /** userId is implicit (dedup keys are unique per user); the learner's local date scopes "once per day". */
    private static String dailyKey(NotificationType type, String context, RuleContext ctx) {
        return type.name() + ":" + context + ":" + ctx.localDate();
    }
}
