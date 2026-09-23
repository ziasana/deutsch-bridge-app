package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.dto.NotificationPageResponse;
import com.deutschbridge.backend.model.dto.NotificationResponse;
import com.deutschbridge.backend.model.entity.Notification;
import com.deutschbridge.backend.model.entity.NotificationPreference;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.NotificationCategory;
import com.deutschbridge.backend.model.enums.NotificationPriority;
import com.deutschbridge.backend.model.enums.NotificationStatus;
import com.deutschbridge.backend.model.enums.NotificationType;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import com.deutschbridge.backend.repository.NotificationPreferenceRepository;
import com.deutschbridge.backend.repository.NotificationRepository;
import com.deutschbridge.backend.repository.UserProfileRepository;
import com.deutschbridge.backend.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Runs the notification pipeline against a real PostgreSQL (Testcontainers): the native
 * reminder-time query, the JPQL filters, and dispatch -> list -> click end to end.
 */
@Testcontainers
@SpringBootTest(properties = "notifications.scheduler.enabled=false")
@ActiveProfiles("test")
@Transactional
class NotificationIntegrationTest {

    /** 19:00 in Berlin - outside default quiet hours. */
    static final Instant FIXED_NOW = Instant.parse("2026-09-23T17:00:00Z");

    @TestConfiguration
    static class FixedClockConfig {
        @Bean
        @Primary
        Clock fixedTestClock() {
            return Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
        }
    }

    @Autowired private UserRepository userRepository;
    @Autowired private UserProfileRepository userProfileRepository;
    @Autowired private NotificationPreferenceRepository preferenceRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private NotificationDispatchService dispatchService;
    @Autowired private NotificationService notificationService;
    @Autowired private NotificationPreferenceService preferenceService;
    @Autowired private EntityManager entityManager;

    private User newLearner(PreferredLanguage language) {
        User user = new User("Learner", "learner-" + System.nanoTime() + "@test.local", "x");
        user = userRepository.save(user);
        if (language != null) {
            UserProfile profile = new UserProfile();
            profile.setUser(user);
            profile.setPreferredLanguage(language);
            user.setProfile(userProfileRepository.save(profile));
        }
        return user;
    }

    private NotificationPreference prefAt(User user, String timezone, LocalTime reminder) {
        NotificationPreference pref = preferenceService.getOrCreate(user.getId());
        pref.setTimezone(timezone);
        pref.setPreferredReminderTime(reminder);
        return preferenceRepository.save(pref);
    }

    @Test
    @DisplayName("reminder-time query -> selects learners whose local reminder time just passed, per timezone")
    void reminderTimeQueryRespectsTimezones() {
        // The native query uses the database's CURRENT_TIMESTAMP, so build times around the real now.
        Instant now = Instant.now();
        LocalTime tokyoNow = now.atZone(ZoneId.of("Asia/Tokyo")).toLocalTime().truncatedTo(ChronoUnit.SECONDS);
        LocalTime utcNow = now.atZone(ZoneOffset.UTC).toLocalTime().truncatedTo(ChronoUnit.SECONDS);
        LocalTime berlinNow = now.atZone(ZoneId.of("Europe/Berlin")).toLocalTime().truncatedTo(ChronoUnit.SECONDS);

        User tokyoDue = newLearner(null);
        prefAt(tokyoDue, "Asia/Tokyo", tokyoNow.minusMinutes(1));
        User utcDue = newLearner(null);
        prefAt(utcDue, "UTC", utcNow.minusMinutes(2));
        User berlinDefault = newLearner(null);
        prefAt(berlinDefault, null, berlinNow.minusMinutes(1)); // null timezone -> Europe/Berlin
        User notYet = newLearner(null);
        prefAt(notYet, "Asia/Tokyo", tokyoNow.plusMinutes(10));
        User tooLate = newLearner(null);
        prefAt(tooLate, "UTC", utcNow.minusMinutes(20));
        User wrongZone = newLearner(null);
        prefAt(wrongZone, "UTC", tokyoNow.minusMinutes(1)); // Tokyo's time interpreted in UTC

        List<String> due = preferenceRepository.findUserIdsAtReminderTime("Europe/Berlin", 300);

        assertTrue(due.contains(tokyoDue.getId()));
        assertTrue(due.contains(utcDue.getId()));
        assertTrue(due.contains(berlinDefault.getId()));
        assertFalse(due.contains(notYet.getId()));
        assertFalse(due.contains(tooLate.getId()));
        assertFalse(due.contains(wrongZone.getId()));
    }

    @Test
    @DisplayName("end to end -> dispatch creates one localized notification, dedups the rerun, click deep-links")
    void dispatchListAndClick() throws Exception {
        User learner = newLearner(PreferredLanguage.EN);
        prefAt(learner, "Europe/Berlin", LocalTime.of(18, 30));

        int created = dispatchService.dispatchForUser(learner.getId());
        int rerun = dispatchService.dispatchForUser(learner.getId());

        assertEquals(1, created);
        assertEquals(0, rerun);
        NotificationPageResponse page = notificationService.list(learner.getId(), 0, 20, null, false);
        assertEquals(1, page.items().size());
        NotificationResponse n = page.items().get(0);
        // A fresh learner has untouched daily words, which the rules turn into DAILY_WORDS_READY.
        assertEquals("DAILY_WORDS_READY", n.type());
        assertEquals("📚 Your 5 words for today are ready", n.title());
        assertEquals("/dashboard/daily-words", n.actionUrl());
        assertEquals(1, notificationService.unreadCount(learner.getId()));

        NotificationResponse clicked = notificationService.click(learner.getId(), n.id());

        assertEquals("/dashboard/daily-words", clicked.actionUrl());
        assertEquals(0, notificationService.unreadCount(learner.getId()));
        assertEquals(NotificationStatus.CLICKED, notificationRepository.findById(n.id()).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("end to end -> Persian learner gets Persian copy; disabled reminders get nothing")
    void localizationAndPreferences() {
        User persian = newLearner(PreferredLanguage.PR);
        prefAt(persian, "Asia/Tehran", LocalTime.of(18, 30)); // 17:00Z = 20:30 Tehran, outside quiet hours
        User optedOut = newLearner(PreferredLanguage.DE);
        NotificationPreference pref = prefAt(optedOut, "Europe/Berlin", LocalTime.of(18, 30));
        pref.setLearningRemindersEnabled(false);
        preferenceRepository.save(pref);

        dispatchService.dispatchForUser(persian.getId());
        dispatchService.dispatchForUser(optedOut.getId());

        String title = notificationService.list(persian.getId(), 0, 20, null, false).items().get(0).title();
        assertTrue(title.contains("واژه"), title);
        assertEquals(0, notificationService.list(optedOut.getId(), 0, 20, null, false).totalElements());
    }

    @Test
    @DisplayName("repository -> category/unread filters, mark-all-read, expiry and the funnel aggregate")
    void repositoryQueries() {
        User learner = newLearner(null);
        save(learner, NotificationType.REVIEW_DUE, "k1");
        save(learner, NotificationType.MILESTONE_REACHED, "k2");
        Notification expired = save(learner, NotificationType.DAILY_WORDS_READY, "k3");
        expired.setExpiresAt(FIXED_NOW.minusSeconds(1));
        notificationRepository.save(expired);

        assertEquals(1, notificationService.list(learner.getId(), 0, 20, List.of(NotificationCategory.PROGRESS), false).totalElements());
        assertEquals(3, notificationService.list(learner.getId(), 0, 20, null, true).totalElements());

        notificationRepository.expireOverdue(EnumSet.of(NotificationStatus.SENT), FIXED_NOW);
        entityManager.clear();
        assertEquals(2, notificationService.unreadCount(learner.getId()));

        notificationService.markAllRead(learner.getId());
        entityManager.clear();
        assertEquals(0, notificationService.unreadCount(learner.getId()));
        assertEquals(2, notificationService.list(learner.getId(), 0, 20, null, false).totalElements());

        Map<String, Long> sentByType = notificationRepository.aggregateFunnelByType(FIXED_NOW.minusSeconds(86_400)).stream()
                .collect(java.util.stream.Collectors.toMap(r -> r[0].toString(), r -> ((Number) r[1]).longValue(), Long::sum));
        assertTrue(sentByType.getOrDefault("REVIEW_DUE", 0L) >= 1);
    }

    private Notification save(User user, NotificationType type, String key) {
        Notification n = new Notification();
        n.setUserId(user.getId());
        n.setType(type);
        n.setCategory(type.getCategory());
        n.setPriority(NotificationPriority.MEDIUM);
        n.setTitle(type.name());
        n.setDedupKey(key);
        n.setStatus(NotificationStatus.SENT);
        n.setSentAt(FIXED_NOW.minusSeconds(30));
        return notificationRepository.save(n);
    }
}
