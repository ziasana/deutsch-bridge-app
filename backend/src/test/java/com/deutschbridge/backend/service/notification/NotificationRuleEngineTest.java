package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.dto.recommendation.LearningState;
import com.deutschbridge.backend.model.enums.NotificationType;
import com.deutschbridge.backend.service.LearningRecommendationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static com.deutschbridge.backend.service.notification.LearningStateFixtures.NOW;
import static com.deutschbridge.backend.service.notification.LearningStateFixtures.state;
import static org.junit.jupiter.api.Assertions.*;

class NotificationRuleEngineTest {

    private static final ZoneId BERLIN = ZoneId.of("Europe/Berlin");
    // 2026-09-23 19:00 in Berlin
    private static final Instant EVENING = Instant.parse("2026-09-23T17:00:00Z");

    // getRecommendations() is pure ranking over the state, so the repositories are never touched.
    private final LearningRecommendationService recommendations = new LearningRecommendationService(
            null, null, null, null, null, null, null, null, null, null);
    private final NotificationRuleEngine engine = new NotificationRuleEngine(recommendations);

    private static NotificationRuleEngine.RuleContext ctx(Instant now, ZoneId zone, LocalTime reminderTime) {
        return new NotificationRuleEngine.RuleContext(now, zone, reminderTime);
    }

    private static Optional<NotificationCandidate> find(List<NotificationCandidate> list, NotificationType type) {
        return list.stream().filter(c -> c.type() == type).findFirst();
    }

    @Test
    @DisplayName("review due -> REVIEW_DUE candidate deep-links to vocabulary practice with count/minutes")
    void reviewDue() {
        List<NotificationCandidate> result = engine.evaluate(state().wordsDue(8).build(), ctx(EVENING, BERLIN, LocalTime.of(18, 30)));

        NotificationCandidate review = find(result, NotificationType.REVIEW_DUE).orElseThrow();
        assertEquals("/dashboard/vocabulary/practice", review.actionUrl());
        assertEquals("VOCABULARY_REVIEW", review.entityType());
        assertEquals("8", review.params().get("count"));
        assertEquals("5", review.params().get("minutes"));
    }

    @Test
    @DisplayName("dedup -> same logical opportunity on the same local day has the same key regardless of count")
    void dedupKeyIgnoresContent() {
        NotificationRuleEngine.RuleContext morning = ctx(Instant.parse("2026-09-23T06:00:00Z"), BERLIN, null);
        NotificationRuleEngine.RuleContext evening = ctx(EVENING, BERLIN, null);

        String k1 = find(engine.evaluate(state().wordsDue(8).build(), morning), NotificationType.REVIEW_DUE).orElseThrow().dedupKey();
        String k2 = find(engine.evaluate(state().wordsDue(12).build(), evening), NotificationType.REVIEW_DUE).orElseThrow().dedupKey();
        String nextDay = find(engine.evaluate(state().wordsDue(12).build(),
                ctx(Instant.parse("2026-09-24T17:00:00Z"), BERLIN, null)), NotificationType.REVIEW_DUE).orElseThrow().dedupKey();

        assertEquals(k1, k2);
        assertNotEquals(k1, nextDay);
    }

    @Test
    @DisplayName("daily words -> ready only while none of today's words are learned")
    void dailyWordsReady() {
        NotificationRuleEngine.RuleContext c = ctx(EVENING, BERLIN, null);

        NotificationCandidate ready = find(engine.evaluate(state().dailyWords(0, 5).build(), c), NotificationType.DAILY_WORDS_READY).orElseThrow();
        assertEquals("/dashboard/daily-words", ready.actionUrl());
        assertEquals("5", ready.params().get("count"));

        assertTrue(find(engine.evaluate(state().dailyWords(2, 5).build(), c), NotificationType.DAILY_WORDS_READY).isEmpty());
    }

    @Test
    @DisplayName("daily plan -> only after the preferred reminder time, in the learner's own timezone")
    void dailyPlanIncompleteRespectsLocalReminderTime() {
        LearningState started = state().dailyWords(2, 5).itemsLearnedToday(2).build();
        LocalTime reminder = LocalTime.of(18, 30);

        // 17:00 UTC = 19:00 Berlin (after 18:30) but 17:00 in UTC (before 18:30) and 02:00 next day in Tokyo.
        assertTrue(find(engine.evaluate(started, ctx(EVENING, BERLIN, reminder)), NotificationType.DAILY_PLAN_INCOMPLETE).isPresent());
        assertTrue(find(engine.evaluate(started, ctx(EVENING, ZoneId.of("UTC"), reminder)), NotificationType.DAILY_PLAN_INCOMPLETE).isEmpty());
        assertTrue(find(engine.evaluate(started, ctx(EVENING, ZoneId.of("Asia/Tokyo"), reminder)), NotificationType.DAILY_PLAN_INCOMPLETE).isEmpty());

        NotificationCandidate plan = find(engine.evaluate(started, ctx(EVENING, BERLIN, reminder)), NotificationType.DAILY_PLAN_INCOMPLETE).orElseThrow();
        assertEquals("/dashboard", plan.actionUrl());
        assertEquals("4", plan.params().get("total"));
    }

    @Test
    @DisplayName("daily plan -> not sent when the learner hasn't started today")
    void dailyPlanNotStarted() {
        LearningState notStarted = state().dailyWords(0, 5).build();
        assertTrue(find(engine.evaluate(notStarted, ctx(EVENING, BERLIN, LocalTime.of(18, 30))), NotificationType.DAILY_PLAN_INCOMPLETE).isEmpty());
    }

    @Test
    @DisplayName("continue learning -> exact activity URL, only after the cooldown")
    void continueLearning() {
        NotificationRuleEngine.RuleContext c = ctx(EVENING, BERLIN, null);

        LearningState recent = state().unfinishedReading("a1", "Im Café", NOW.minusMinutes(30)).build();
        assertTrue(find(engine.evaluate(recent, c), NotificationType.CONTINUE_LEARNING).isEmpty());

        LearningState stale = state().unfinishedReading("a1", "Im Café", NOW.minusHours(3)).build();
        NotificationCandidate cont = find(engine.evaluate(stale, c), NotificationType.CONTINUE_LEARNING).orElseThrow();
        assertEquals("/dashboard/reading/article?id=a1", cont.actionUrl());
        assertEquals("a1", cont.entityId());
        assertEquals("CONTINUE_LEARNING.READING", cont.templateKey());
        assertEquals("Im Café", cont.params().get("title"));
    }

    @Test
    @DisplayName("milestone -> highest reached threshold per metric, keyed without a date (once ever)")
    void milestones() {
        List<NotificationCandidate> result = engine.evaluate(state().wordsMastered(57).streak(8).build(), ctx(EVENING, BERLIN, null));

        List<NotificationCandidate> milestones = result.stream().filter(c -> c.type() == NotificationType.MILESTONE_REACHED).toList();
        assertEquals(2, milestones.size());
        assertEquals("MILESTONE_REACHED:WORDS:50", milestones.get(0).dedupKey());
        assertEquals("50", milestones.get(0).params().get("value"));
        assertEquals("MILESTONE_REACHED:STREAK:7", milestones.get(1).dedupKey());
        assertNull(milestones.get(0).expiresAt());
    }

    @Test
    @DisplayName("nothing to do -> no candidates")
    void nothingToDo() {
        assertTrue(engine.evaluate(state().build(), ctx(EVENING, BERLIN, LocalTime.of(18, 30))).isEmpty());
    }
}
