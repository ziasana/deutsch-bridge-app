package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.entity.Notification;
import com.deutschbridge.backend.model.entity.NotificationPreference;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.NotificationCategory;
import com.deutschbridge.backend.model.enums.NotificationPriority;
import com.deutschbridge.backend.model.enums.NotificationStatus;
import com.deutschbridge.backend.model.enums.NotificationType;
import com.deutschbridge.backend.repository.NotificationRepository;
import com.deutschbridge.backend.repository.UserRepository;
import com.deutschbridge.backend.service.LearningRecommendationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationDispatchServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationPreferenceService preferenceService;
    @Mock private NotificationSettingsService settingsService;
    @Mock private NotificationRuleEngine ruleEngine;
    @Mock private NotificationTemplateService templateService;
    @Mock private LearningRecommendationService recommendationService;
    @Mock private NotificationEventTracker events;
    @Mock private UserRepository userRepository;
    @Mock private Clock clock;

    @InjectMocks
    private NotificationDispatchService service;

    private static final ZoneId BERLIN = ZoneId.of("Europe/Berlin");
    /** 19:00 in Berlin - outside default quiet hours. */
    private static final Instant EVENING = Instant.parse("2026-09-23T17:00:00Z");

    private User user;
    private NotificationPreference pref;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId("user-1");
        pref = new NotificationPreference();
        pref.setUserId("user-1");
        lenient().when(templateService.render(anyString(), anyString(), anyMap()))
                .thenReturn(new NotificationTemplateService.Rendered("title", "body"));
        lenient().when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static NotificationSettingsService.GlobalSettings global(Map<NotificationType, Boolean> types) {
        return new NotificationSettingsService.GlobalSettings(true, 2, 1,
                LocalTime.of(18, 30), LocalTime.of(22, 0), LocalTime.of(8, 0), types, 180, false, List.of());
    }

    private static NotificationSettingsService.GlobalSettings withTiming(int minGapMinutes, boolean testMode, String... testEmails) {
        return new NotificationSettingsService.GlobalSettings(true, 2, 1,
                LocalTime.of(18, 30), LocalTime.of(22, 0), LocalTime.of(8, 0), new EnumMap<>(NotificationType.class),
                minGapMinutes, testMode, List.of(testEmails));
    }

    private static NotificationSettingsService.GlobalSettings global() {
        return global(new EnumMap<>(NotificationType.class));
    }

    private static NotificationCandidate candidate(NotificationType type, NotificationPriority priority, int rank, Map<String, String> params) {
        return new NotificationCandidate(type, type.name(), priority, type.name() + ":ctx:2026-09-23",
                "ENTITY", null, "/dashboard/x", params, null, rank);
    }

    private static NotificationCandidate review(int count) {
        return candidate(NotificationType.REVIEW_DUE, NotificationPriority.HIGH, 0, Map.of("count", String.valueOf(count)));
    }

    private void learningSentToday(long count) {
        when(notificationRepository.countByUserIdAndCategoryAndSentAtGreaterThanEqualAndSentAtLessThan(
                eq("user-1"), eq(NotificationCategory.LEARNING), any(), any())).thenReturn(count);
    }

    private List<Notification> created() {
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, atLeast(0)).save(captor.capture());
        return captor.getAllValues();
    }

    // ---------------------------------------------------------------
    // Preferences
    // ---------------------------------------------------------------
    @Test
    @DisplayName("reminder enabled -> review notification is created, rendered and marked SENT")
    void reminderEnabledCreates() {
        int result = service.dispatch(user, pref, global(), List.of(review(8)), EVENING, BERLIN);

        assertEquals(1, result);
        Notification n = created().get(0);
        assertEquals(NotificationType.REVIEW_DUE, n.getType());
        assertEquals(NotificationStatus.SENT, n.getStatus());
        assertEquals("/dashboard/x", n.getActionUrl());
        assertEquals(EVENING, n.getSentAt());
    }

    @Test
    @DisplayName("reminder disabled -> nothing is created")
    void reminderDisabledBlocks() {
        pref.setReviewRemindersEnabled(false);

        assertEquals(0, service.dispatch(user, pref, global(), List.of(review(8)), EVENING, BERLIN));
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("admin disabled the type -> nothing is created")
    void adminTypeDisabledBlocks() {
        Map<NotificationType, Boolean> types = new EnumMap<>(NotificationType.class);
        types.put(NotificationType.REVIEW_DUE, false);

        assertEquals(0, service.dispatch(user, pref, global(types), List.of(review(8)), EVENING, BERLIN));
    }

    // ---------------------------------------------------------------
    // Quiet hours
    // ---------------------------------------------------------------
    @Test
    @DisplayName("inside quiet hours (23:00 Berlin) -> nothing is created")
    void insideQuietHours() {
        Instant lateNight = Instant.parse("2026-09-23T21:00:00Z");

        assertEquals(0, service.dispatch(user, pref, global(), List.of(review(8)), lateNight, BERLIN));
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("quiet hours switched off -> 23:00 is fine")
    void quietHoursDisabled() {
        pref.setQuietHoursEnabled(false);
        Instant lateNight = Instant.parse("2026-09-23T21:00:00Z");

        assertEquals(1, service.dispatch(user, pref, global(), List.of(review(8)), lateNight, BERLIN));
    }

    // ---------------------------------------------------------------
    // Frequency
    // ---------------------------------------------------------------
    @Test
    @DisplayName("frequency -> 0 learning notifications today: allowed")
    void zeroSentAllowed() {
        learningSentToday(0);
        assertEquals(1, service.dispatch(user, pref, global(), List.of(review(8)), EVENING, BERLIN));
    }

    @Test
    @DisplayName("frequency -> 1 learning notification today: allowed")
    void oneSentAllowed() {
        learningSentToday(1);
        assertEquals(1, service.dispatch(user, pref, global(), List.of(review(8)), EVENING, BERLIN));
    }

    @Test
    @DisplayName("frequency -> 2 learning notifications today with limit 2: blocked")
    void twoSentBlocked() {
        learningSentToday(2);
        assertEquals(0, service.dispatch(user, pref, global(), List.of(review(8)), EVENING, BERLIN));
    }

    @Test
    @DisplayName("frequency -> a nudge sent 1h ago blocks another one (minimum gap)")
    void minimumGapBetweenNudges() {
        Notification last = new Notification();
        last.setSentAt(EVENING.minusSeconds(3600));
        when(notificationRepository.findFirstByUserIdAndCategoryInAndSentAtIsNotNullOrderBySentAtDesc(eq("user-1"), anyCollection()))
                .thenReturn(Optional.of(last));

        assertEquals(0, service.dispatch(user, pref, global(), List.of(review(8)), EVENING, BERLIN));
    }

    @Test
    @DisplayName("milestones don't count against the learning limit")
    void milestoneIgnoresLearningLimit() {
        lenient().when(notificationRepository.countByUserIdAndCategoryAndSentAtGreaterThanEqualAndSentAtLessThan(
                eq("user-1"), eq(NotificationCategory.LEARNING), any(), any())).thenReturn(2L);
        NotificationCandidate milestone = candidate(NotificationType.MILESTONE_REACHED, NotificationPriority.MEDIUM, 1, Map.of("value", "50"));

        assertEquals(1, service.dispatch(user, pref, global(), List.of(review(8), milestone), EVENING, BERLIN));
        assertEquals(NotificationType.MILESTONE_REACHED, created().get(0).getType());
    }

    // ---------------------------------------------------------------
    // Deduplication
    // ---------------------------------------------------------------
    @Test
    @DisplayName("dedup -> same logical event refreshes the existing unread notification instead of creating one")
    void sameLogicalEventRefreshes() {
        Notification existing = new Notification();
        existing.setUserId("user-1");
        existing.setStatus(NotificationStatus.SENT);
        existing.setParams(new HashMap<>(Map.of("count", "8")));
        when(notificationRepository.findByUserIdAndDedupKey("user-1", review(12).dedupKey())).thenReturn(Optional.of(existing));

        int result = service.dispatch(user, pref, global(), List.of(review(12)), EVENING, BERLIN);

        assertEquals(0, result);
        List<Notification> saved = created();
        assertEquals(1, saved.size());
        assertSame(existing, saved.get(0));
        assertEquals("12", existing.getParams().get("count"));
    }

    @Test
    @DisplayName("dedup -> an already-read notification for the same event is left alone")
    void readNotificationNotRefreshed() {
        Notification existing = new Notification();
        existing.setStatus(NotificationStatus.READ);
        existing.setReadAt(EVENING.minusSeconds(60));
        existing.setParams(new HashMap<>(Map.of("count", "8")));
        when(notificationRepository.findByUserIdAndDedupKey(eq("user-1"), anyString())).thenReturn(Optional.of(existing));

        assertEquals(0, service.dispatch(user, pref, global(), List.of(review(12)), EVENING, BERLIN));
        verify(notificationRepository, never()).save(any());
    }

    // ---------------------------------------------------------------
    // Priority
    // ---------------------------------------------------------------
    @Test
    @DisplayName("priority -> review due + generic daily-words reminder: only the review is sent")
    void reviewWins() {
        NotificationCandidate dailyWords = candidate(NotificationType.DAILY_WORDS_READY, NotificationPriority.MEDIUM, 0, Map.of("count", "5"));
        NotificationCandidate reviewDue = candidate(NotificationType.REVIEW_DUE, NotificationPriority.HIGH, 1, Map.of("count", "8"));

        assertEquals(1, service.dispatch(user, pref, global(), List.of(dailyWords, reviewDue), EVENING, BERLIN));

        List<Notification> saved = created();
        assertEquals(1, saved.size());
        assertEquals(NotificationType.REVIEW_DUE, saved.get(0).getType());
    }

    // ---------------------------------------------------------------
    // Admin-configured gap and test mode
    // ---------------------------------------------------------------
    @Test
    @DisplayName("minimum gap is the admin's setting -> a 30-minute gap lets a nudge through 1h after the last")
    void configurableMinimumGap() {
        Notification last = new Notification();
        last.setSentAt(EVENING.minusSeconds(3600));
        when(notificationRepository.findFirstByUserIdAndCategoryInAndSentAtIsNotNullOrderBySentAtDesc(eq("user-1"), anyCollection()))
                .thenReturn(Optional.of(last));

        assertEquals(1, service.dispatch(user, pref, withTiming(30, false), List.of(review(8)), EVENING, BERLIN));
    }

    @Test
    @DisplayName("test mode -> ignores quiet hours, daily limit and dedup, and makes the dedup key unique")
    void testModeBypassesTimingRules() {
        lenient().when(notificationRepository.countByUserIdAndCategoryAndSentAtGreaterThanEqualAndSentAtLessThan(
                any(), any(), any(), any())).thenReturn(5L);
        Instant lateNight = Instant.parse("2026-09-23T21:00:00Z");

        int created = service.dispatch(user, pref, withTiming(180, true, "tester@example.com"),
                List.of(review(8)), lateNight, BERLIN, true);

        assertEquals(1, created);
        String key = created().get(0).getDedupKey();
        assertTrue(key.startsWith(review(8).dedupKey() + NotificationDispatchService.TEST_KEY_MARKER), key);
        assertEquals(review(8).dedupKey(), NotificationDispatchService.baseKey(key));
        verify(notificationRepository, never()).findByUserIdAndDedupKey(any(), any());
    }

    @Test
    @DisplayName("test mode still respects the learner's own preferences")
    void testModeKeepsPreferences() {
        pref.setReviewRemindersEnabled(false);

        assertEquals(0, service.dispatch(user, pref, withTiming(180, true, "tester@example.com"),
                List.of(review(8)), EVENING, BERLIN, true));
    }

    @Test
    @DisplayName("test learners -> only listed emails (case-insensitive), and only while test mode is on")
    void testUserMatching() {
        NotificationSettingsService.GlobalSettings on = withTiming(180, true, "tester@example.com");
        NotificationSettingsService.GlobalSettings off = withTiming(180, false, "tester@example.com");

        assertTrue(on.isTestUser(" Tester@Example.com "));
        assertFalse(on.isTestUser("someone@example.com"));
        assertFalse(off.isTestUser("tester@example.com"));
        assertEquals(List.of("a@x.de", "b@y.com"), NotificationSettingsService.parseEmails("A@x.de, b@y.com;\nnot-an-email a@x.de"));
    }
}
