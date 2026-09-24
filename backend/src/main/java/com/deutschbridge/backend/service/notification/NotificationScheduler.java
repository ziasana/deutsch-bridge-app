package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.entity.NotificationBroadcast;
import com.deutschbridge.backend.model.entity.NotificationPreference;
import com.deutschbridge.backend.model.enums.NotificationBroadcastStatus;
import com.deutschbridge.backend.model.enums.NotificationStatus;
import com.deutschbridge.backend.repository.NotificationBroadcastRepository;
import com.deutschbridge.backend.repository.NotificationPreferenceRepository;
import com.deutschbridge.backend.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;

/**
 * Periodic notification jobs.
 *
 * <ul>
 *   <li>Sweep (every ~15 min): expires overdue notifications, backfills preferences for older accounts,
 *       then evaluates every learner who has notifications enabled - paged, never all users at once.</li>
 *   <li>Daily reminder (every 5 min): the database selects only learners whose preferred reminder time
 *       was just reached in their own timezone, so time-gated rules (daily plan incomplete) fire on time
 *       rather than up to a sweep interval late.</li>
 * </ul>
 * Each learner is dispatched in its own transaction; one failure never stops the rest of the run.
 */
@Component
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);
    private static final int PAGE_SIZE = 200;

    private final NotificationPreferenceRepository preferenceRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceService preferenceService;
    private final NotificationSettingsService settingsService;
    private final NotificationDispatchService dispatchService;
    private final NotificationBroadcastRepository broadcastRepository;
    private final NotificationBroadcastDispatchService broadcastDispatchService;
    private final Clock clock;
    private final int reminderWindowSeconds;

    public NotificationScheduler(NotificationPreferenceRepository preferenceRepository,
                                 NotificationRepository notificationRepository,
                                 NotificationPreferenceService preferenceService,
                                 NotificationSettingsService settingsService,
                                 NotificationDispatchService dispatchService,
                                 NotificationBroadcastRepository broadcastRepository,
                                 NotificationBroadcastDispatchService broadcastDispatchService,
                                 Clock clock,
                                 @Value("${notifications.scheduler.reminder-window-seconds:300}") int reminderWindowSeconds) {
        this.preferenceRepository = preferenceRepository;
        this.notificationRepository = notificationRepository;
        this.preferenceService = preferenceService;
        this.settingsService = settingsService;
        this.dispatchService = dispatchService;
        this.broadcastRepository = broadcastRepository;
        this.broadcastDispatchService = broadcastDispatchService;
        this.clock = clock;
        this.reminderWindowSeconds = reminderWindowSeconds;
    }

    @Scheduled(initialDelayString = "${notifications.scheduler.initial-delay-ms:120000}",
            fixedDelayString = "${notifications.scheduler.sweep-interval-ms:900000}")
    public void sweep() {
        sweep(false);
    }

    /** @param manualRun true for the admin's "Run evaluation now" (enables test mode for test learners). */
    public synchronized void sweep(boolean manualRun) {
        expireOverdue();
        if (!settingsService.get().enabled()) return;

        int backfilled = preferenceService.backfillMissing();
        if (backfilled > 0) log.info("Created default notification preferences for {} learner(s)", backfilled);

        int evaluated = 0;
        int created = 0;
        Slice<NotificationPreference> slice;
        int page = 0;
        do {
            slice = preferenceRepository.findSweepable(PageRequest.of(page++, PAGE_SIZE));
            for (NotificationPreference pref : slice) {
                created += dispatchSafely(pref.getUserId(), manualRun);
                evaluated++;
            }
        } while (slice.hasNext());
        log.info("Notification sweep evaluated {} learner(s), created {} notification(s)", evaluated, created);
    }

    @Scheduled(cron = "${notifications.scheduler.reminder-cron:0 */5 * * * *}")
    public void dailyReminders() {
        if (!settingsService.get().enabled()) return;

        List<String> userIds = preferenceRepository.findUserIdsAtReminderTime(
                NotificationPolicy.DEFAULT_ZONE.getId(), reminderWindowSeconds);
        int created = userIds.stream().mapToInt(id -> dispatchSafely(id, false)).sum();
        if (!userIds.isEmpty()) {
            log.info("Reminder-time run evaluated {} learner(s), created {} notification(s)", userIds.size(), created);
        }
    }

    public void expireOverdue() {
        notificationRepository.expireOverdue(
                EnumSet.of(NotificationStatus.SENT, NotificationStatus.DELIVERED), Instant.now(clock));
    }

    /** Fans out admin broadcasts whose scheduledAt has been reached. */
    @Scheduled(fixedDelayString = "${notifications.broadcast-scheduler.dispatch-interval-ms:60000}")
    public void dispatchDueBroadcasts() {
        List<NotificationBroadcast> due = broadcastRepository.findByStatusAndScheduledAtLessThanEqual(
                NotificationBroadcastStatus.SCHEDULED, Instant.now(clock));
        for (NotificationBroadcast broadcast : due) {
            try {
                broadcastDispatchService.send(broadcast);
            } catch (Exception e) {
                log.warn("Broadcast dispatch failed for {}: {}", broadcast.getId(), e.getMessage());
            }
        }
    }

    private int dispatchSafely(String userId, boolean manualRun) {
        try {
            return dispatchService.dispatchForUser(userId, manualRun);
        } catch (Exception e) {
            log.warn("Notification dispatch failed for user {}: {}", userId, e.getMessage());
            return 0;
        }
    }
}
