package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.dto.recommendation.LearningState;
import com.deutschbridge.backend.model.entity.Notification;
import com.deutschbridge.backend.model.entity.NotificationPreference;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.NotificationCategory;
import com.deutschbridge.backend.model.enums.NotificationStatus;
import com.deutschbridge.backend.repository.NotificationRepository;
import com.deutschbridge.backend.repository.UserRepository;
import com.deutschbridge.backend.service.LearningRecommendationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Decides, for one learner, which (if any) notification to create right now:
 *
 * <pre>
 * learning state -> candidates (rule engine) -> admin type switches -> learner preferences
 *   -> quiet hours -> dedup (refresh the existing one instead) -> daily frequency limits
 *   -> minimum gap since the last nudge -> highest-value candidate -> create
 * </pre>
 *
 * At most one LEARNING/REMINDER notification and one PROGRESS notification are created per run.
 * The same pass also closes the loop on earlier notifications whose opportunity has since been
 * resolved: clicked ones become COMPLETED (a learning conversion), unread ones EXPIRED.
 */
@Service
public class NotificationDispatchService {

    static final int MAX_PROGRESS_PER_DAY = 1;
    /** Suffix that makes a test-mode notification's dedup key unique, so tests can re-send. */
    static final String TEST_KEY_MARKER = ":test:";
    /** How far back to look for open notifications that may have been resolved. */
    private static final Duration RESOLUTION_LOOKBACK = Duration.ofDays(8);

    private static final Set<NotificationCategory> NUDGE_CATEGORIES =
            EnumSet.of(NotificationCategory.LEARNING, NotificationCategory.REMINDER);
    private static final Set<NotificationStatus> OPEN_STATUSES = EnumSet.of(
            NotificationStatus.SENT, NotificationStatus.DELIVERED, NotificationStatus.READ, NotificationStatus.CLICKED);

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceService preferenceService;
    private final NotificationSettingsService settingsService;
    private final NotificationRuleEngine ruleEngine;
    private final NotificationTemplateService templateService;
    private final LearningRecommendationService recommendationService;
    private final NotificationEventTracker events;
    private final UserRepository userRepository;
    private final Clock clock;

    public NotificationDispatchService(NotificationRepository notificationRepository,
                                       NotificationPreferenceService preferenceService,
                                       NotificationSettingsService settingsService,
                                       NotificationRuleEngine ruleEngine,
                                       NotificationTemplateService templateService,
                                       LearningRecommendationService recommendationService,
                                       NotificationEventTracker events,
                                       UserRepository userRepository,
                                       Clock clock) {
        this.notificationRepository = notificationRepository;
        this.preferenceService = preferenceService;
        this.settingsService = settingsService;
        this.ruleEngine = ruleEngine;
        this.templateService = templateService;
        this.recommendationService = recommendationService;
        this.events = events;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    /** @return the number of notifications created for this learner (0-2). */
    @Transactional
    public int dispatchForUser(String userId) {
        return dispatchForUser(userId, false);
    }

    /**
     * @param manualRun true when an admin pressed "Run evaluation now". Only then do listed test
     *                  learners get test-mode treatment; scheduled runs always follow the normal rules.
     */
    @Transactional
    public int dispatchForUser(String userId, boolean manualRun) {
        NotificationSettingsService.GlobalSettings global = settingsService.get();
        if (!global.enabled()) return 0;

        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) return 0;

        NotificationPreference pref = preferenceService.getOrCreate(userId);
        Instant now = Instant.now(clock);
        ZoneId zone = preferenceService.zoneOf(pref);

        boolean testMode = manualRun && global.isTestUser(user.get().getEmail());

        LearningState state = recommendationService.buildState(user.get());
        List<NotificationCandidate> candidates = ruleEngine.evaluate(state,
                new NotificationRuleEngine.RuleContext(now, zone, pref.getPreferredReminderTime(), testMode));

        resolveFinishedOpportunities(userId, candidates, now);

        return dispatch(user.get(), pref, global, candidates, now, zone, testMode);
    }

    /** The selection pipeline, separated from state loading so it can be tested with plain candidates. */
    int dispatch(User user, NotificationPreference pref, NotificationSettingsService.GlobalSettings global,
                 List<NotificationCandidate> candidates, Instant now, ZoneId zone) {
        return dispatch(user, pref, global, candidates, now, zone, false);
    }

    /**
     * {@code testMode} (admin test learners, manual runs only) skips quiet hours, daily limits, the
     * minimum gap and dedup - so every run sends the current best candidate. Admin type switches and
     * the learner's own preferences still apply.
     */
    int dispatch(User user, NotificationPreference pref, NotificationSettingsService.GlobalSettings global,
                 List<NotificationCandidate> candidates, Instant now, ZoneId zone, boolean testMode) {
        String language = NotificationTemplateService.languageFor(user);

        List<NotificationCandidate> eligible = candidates.stream()
                .filter(c -> global.isTypeEnabled(c.type()))
                .filter(c -> NotificationPreferenceService.allows(pref, c.type()))
                .sorted(Comparator.comparing(NotificationCandidate::priority).reversed()
                        .thenComparingInt(NotificationCandidate::rank))
                .toList();

        // Refresh already-sent notifications for the same logical opportunity (e.g. 8 -> 12 words due).
        // This happens even during quiet hours: it updates content, it never re-notifies.
        List<NotificationCandidate> fresh = testMode
                ? eligible.stream().map(c -> withTestKey(c, now)).toList()
                : eligible.stream().filter(c -> !refreshExisting(user.getId(), c, language)).toList();

        if (!testMode && pref.isQuietHoursEnabled() && NotificationPolicy.isInQuietHours(
                now.atZone(zone).toLocalTime(), pref.getQuietHoursStart(), pref.getQuietHoursEnd())) {
            return 0;
        }

        boolean nudgeCreated = false;
        boolean progressCreated = false;
        for (NotificationCandidate candidate : fresh) {
            NotificationCategory category = candidate.type().getCategory();
            boolean isNudge = NUDGE_CATEGORIES.contains(category);
            if ((isNudge && nudgeCreated) || (category == NotificationCategory.PROGRESS && progressCreated)) continue;
            if (!testMode && !canSend(user.getId(), pref, global, category, now, zone)) continue;

            create(user.getId(), candidate, language, now);
            if (isNudge) nudgeCreated = true;
            if (category == NotificationCategory.PROGRESS) progressCreated = true;
        }
        return (nudgeCreated ? 1 : 0) + (progressCreated ? 1 : 0);
    }

    public boolean canSendLearningNotification(String userId, NotificationPreference pref, Instant now, ZoneId zone) {
        return canSend(userId, pref, settingsService.get(), NotificationCategory.LEARNING, now, zone);
    }

    public boolean canSendReminderNotification(String userId, NotificationPreference pref, Instant now, ZoneId zone) {
        return canSend(userId, pref, settingsService.get(), NotificationCategory.REMINDER, now, zone);
    }

    /** Daily frequency limits per category, plus a minimum gap between any two nudges. */
    private boolean canSend(String userId, NotificationPreference pref, NotificationSettingsService.GlobalSettings global,
                            NotificationCategory category, Instant now, ZoneId zone) {
        int limit = switch (category) {
            case LEARNING -> NotificationPolicy.effectiveLimit(pref.getMaxLearningNotificationsPerDay(), global.maxLearningPerDay());
            case REMINDER -> NotificationPolicy.effectiveLimit(pref.getMaxReminderNotificationsPerDay(), global.maxReminderPerDay());
            case PROGRESS -> MAX_PROGRESS_PER_DAY;
            case SYSTEM, PREMIUM -> Integer.MAX_VALUE;
        };
        if (limit == Integer.MAX_VALUE) return true;

        long sentToday = notificationRepository.countByUserIdAndCategoryAndSentAtGreaterThanEqualAndSentAtLessThan(
                userId, category, NotificationPolicy.startOfLocalDay(now, zone), NotificationPolicy.startOfNextLocalDay(now, zone));
        if (!NotificationPolicy.withinLimit(sentToday, limit)) return false;

        if (NUDGE_CATEGORIES.contains(category)) {
            Optional<Notification> lastNudge = notificationRepository
                    .findFirstByUserIdAndCategoryInAndSentAtIsNotNullOrderBySentAtDesc(userId, NUDGE_CATEGORIES);
            Duration minGap = Duration.ofMinutes(global.minGapMinutes());
            return lastNudge.map(n -> !n.getSentAt().plus(minGap).isAfter(now)).orElse(true);
        }
        return true;
    }

    private static NotificationCandidate withTestKey(NotificationCandidate c, Instant now) {
        return new NotificationCandidate(c.type(), c.templateKey(), c.priority(),
                c.dedupKey() + TEST_KEY_MARKER + now.toEpochMilli(), c.entityType(), c.entityId(), c.actionUrl(),
                c.params(), c.expiresAt(), c.rank());
    }

    /** Test-mode keys carry a unique suffix; resolution compares the logical opportunity underneath. */
    static String baseKey(String dedupKey) {
        if (dedupKey == null) return null;
        int marker = dedupKey.indexOf(TEST_KEY_MARKER);
        return marker < 0 ? dedupKey : dedupKey.substring(0, marker);
    }

    /** @return true when a notification for this opportunity already exists (so no new one is created). */
    private boolean refreshExisting(String userId, NotificationCandidate candidate, String language) {
        Optional<Notification> existing = notificationRepository.findByUserIdAndDedupKey(userId, candidate.dedupKey());
        if (existing.isEmpty()) return false;

        Notification n = existing.get();
        boolean stillOpenAndUnread = n.getReadAt() == null
                && (n.getStatus() == NotificationStatus.SENT || n.getStatus() == NotificationStatus.DELIVERED);
        if (stillOpenAndUnread && !Objects.equals(n.getParams(), candidate.params())) {
            NotificationTemplateService.Rendered text = templateService.render(candidate.templateKey(), language, candidate.params());
            n.setTitle(text.title());
            n.setBody(text.body());
            n.setParams(new HashMap<>(candidate.params()));
            notificationRepository.save(n);
        }
        return true;
    }

    private void create(String userId, NotificationCandidate c, String language, Instant now) {
        NotificationTemplateService.Rendered text = templateService.render(c.templateKey(), language, c.params());

        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(c.type());
        n.setCategory(c.type().getCategory());
        n.setPriority(c.priority());
        n.setTitle(text.title());
        n.setBody(text.body());
        n.setEntityType(c.entityType());
        n.setEntityId(c.entityId());
        n.setActionUrl(c.actionUrl());
        n.setDedupKey(c.dedupKey());
        n.setTemplateKey(c.templateKey());
        n.setParams(new HashMap<>(c.params()));
        n.setExpiresAt(c.expiresAt());
        n.setCreatedAt(now);
        // In-app is the only channel today, so creating == delivering to the notification center.
        n.setStatus(NotificationStatus.SENT);
        n.setScheduledAt(now);
        n.setSentAt(now);

        Notification saved = notificationRepository.save(n);
        events.track(NotificationEventTracker.CREATED, saved);
        events.track(NotificationEventTracker.SENT, saved);
    }

    /**
     * A state-based notification whose candidate disappeared means the learner dealt with it (e.g. the
     * review queue is empty). If they got there via the notification it's a conversion (COMPLETED);
     * if they never opened it, it's withdrawn (EXPIRED) so the bell doesn't show stale work.
     */
    private void resolveFinishedOpportunities(String userId, List<NotificationCandidate> candidates, Instant now) {
        Set<String> activeKeys = candidates.stream().map(NotificationCandidate::dedupKey).collect(Collectors.toSet());
        List<Notification> open = notificationRepository.findByUserIdAndTypeInAndCompletedAtIsNullAndStatusInAndCreatedAtAfter(
                userId, NotificationRuleEngine.STATE_BASED_TYPES, OPEN_STATUSES, now.minus(RESOLUTION_LOOKBACK));

        for (Notification n : open) {
            if (activeKeys.contains(baseKey(n.getDedupKey()))) continue;
            if (n.getClickedAt() != null) {
                n.setStatus(NotificationStatus.COMPLETED);
                n.setCompletedAt(now);
                events.track(NotificationEventTracker.LEARNING_COMPLETED, n);
            } else if (n.getReadAt() == null) {
                n.setStatus(NotificationStatus.EXPIRED);
                events.track(NotificationEventTracker.EXPIRED, n);
            } else {
                continue;
            }
            notificationRepository.save(n);
        }
    }
}
