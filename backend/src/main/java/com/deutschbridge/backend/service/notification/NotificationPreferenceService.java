package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.dto.NotificationPreferenceDto;
import com.deutschbridge.backend.model.entity.NotificationPreference;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.NotificationType;
import com.deutschbridge.backend.repository.NotificationPreferenceRepository;
import com.deutschbridge.backend.repository.UserProfileRepository;
import com.deutschbridge.backend.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

/**
 * Reads/writes a learner's NotificationPreference (created lazily with the admin's current defaults)
 * and decides which notification types those preferences allow. SYSTEM and PREMIUM notifications are
 * never blocked by learning-reminder settings.
 */
@Service
public class NotificationPreferenceService {

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");
    private static final int BACKFILL_BATCH = 200;

    private final NotificationPreferenceRepository preferenceRepository;
    private final NotificationSettingsService settingsService;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public NotificationPreferenceService(NotificationPreferenceRepository preferenceRepository,
                                         NotificationSettingsService settingsService,
                                         UserRepository userRepository,
                                         UserProfileRepository userProfileRepository) {
        this.preferenceRepository = preferenceRepository;
        this.settingsService = settingsService;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public NotificationPreference getOrCreate(String userId) {
        return preferenceRepository.findByUserId(userId).orElseGet(() -> {
            try {
                return preferenceRepository.saveAndFlush(newDefaults(userId));
            } catch (DataIntegrityViolationException e) {
                // Created concurrently by another request/sweep - use that row.
                return preferenceRepository.findByUserId(userId).orElseThrow(() -> e);
            }
        });
    }

    public NotificationPreferenceDto getDto(String userId) {
        return toDto(getOrCreate(userId));
    }

    @Transactional
    public NotificationPreferenceDto update(String userId, NotificationPreferenceDto request) {
        NotificationPreference pref = getOrCreate(userId);

        if (request.learningRemindersEnabled() != null) pref.setLearningRemindersEnabled(request.learningRemindersEnabled());
        if (request.reviewRemindersEnabled() != null) pref.setReviewRemindersEnabled(request.reviewRemindersEnabled());
        if (request.dailyPlanRemindersEnabled() != null) pref.setDailyPlanRemindersEnabled(request.dailyPlanRemindersEnabled());
        if (request.examRemindersEnabled() != null) pref.setExamRemindersEnabled(request.examRemindersEnabled());
        if (request.progressNotificationsEnabled() != null) pref.setProgressNotificationsEnabled(request.progressNotificationsEnabled());
        if (request.milestoneNotificationsEnabled() != null) pref.setMilestoneNotificationsEnabled(request.milestoneNotificationsEnabled());
        if (request.weeklyProgressEnabled() != null) pref.setWeeklyProgressEnabled(request.weeklyProgressEnabled());
        if (request.quietHoursEnabled() != null) pref.setQuietHoursEnabled(request.quietHoursEnabled());
        if (request.quietHoursStart() != null) pref.setQuietHoursStart(parseTime(request.quietHoursStart(), "quietHoursStart"));
        if (request.quietHoursEnd() != null) pref.setQuietHoursEnd(parseTime(request.quietHoursEnd(), "quietHoursEnd"));
        if (request.preferredReminderTime() != null) pref.setPreferredReminderTime(parseTime(request.preferredReminderTime(), "preferredReminderTime"));
        if (request.timezone() != null) {
            if (!NotificationPolicy.isValidZone(request.timezone())) {
                throw new IllegalArgumentException("Unknown timezone: " + request.timezone());
            }
            pref.setTimezone(request.timezone());
        }

        NotificationPreference saved = preferenceRepository.save(pref);
        syncLegacyProfileFlag(userId, saved.isLearningRemindersEnabled());
        return toDto(saved);
    }

    /** Creates default preference rows for learners registered before notifications existed. */
    @Transactional
    public int backfillMissing() {
        int created = 0;
        List<String> userIds;
        do {
            userIds = preferenceRepository.findUserIdsWithoutPreference(PageRequest.of(0, BACKFILL_BATCH));
            preferenceRepository.saveAll(userIds.stream().map(this::newDefaults).toList());
            created += userIds.size();
        } while (userIds.size() == BACKFILL_BATCH);
        return created;
    }

    public ZoneId zoneOf(NotificationPreference pref) {
        return NotificationPolicy.resolveZone(pref.getTimezone());
    }

    /** Whether the learner's own settings permit this notification type. */
    public static boolean allows(NotificationPreference pref, NotificationType type) {
        return switch (type.getCategory()) {
            case SYSTEM, PREMIUM -> true;
            case PROGRESS -> pref.isProgressNotificationsEnabled() && switch (type) {
                case WEEKLY_PROGRESS -> pref.isWeeklyProgressEnabled();
                default -> pref.isMilestoneNotificationsEnabled();
            };
            case LEARNING, REMINDER -> pref.isLearningRemindersEnabled() && switch (type) {
                case REVIEW_DUE, VOCABULARY_REVIEW, EXPRESSION_REVIEW -> pref.isReviewRemindersEnabled();
                case DAILY_PLAN_READY, DAILY_PLAN_INCOMPLETE -> pref.isDailyPlanRemindersEnabled();
                case EXAM_PRACTICE_READY, EXAM_PLAN_REMINDER -> pref.isExamRemindersEnabled();
                default -> true;
            };
        };
    }

    private NotificationPreference newDefaults(String userId) {
        NotificationSettingsService.GlobalSettings global = settingsService.get();
        NotificationPreference pref = new NotificationPreference();
        pref.setUserId(userId);
        pref.setPreferredReminderTime(global.defaultReminderTime());
        pref.setQuietHoursStart(global.quietHoursStart());
        pref.setQuietHoursEnd(global.quietHoursEnd());
        return pref;
    }

    /** Keeps the older UserProfile.notificationsEnabled flag meaningful: it mirrors the master switch. */
    private void syncLegacyProfileFlag(String userId, boolean enabled) {
        userRepository.findById(userId).map(User::getProfile).ifPresent((UserProfile profile) -> {
            if (profile.isNotificationsEnabled() != enabled) {
                profile.setNotificationsEnabled(enabled);
                userProfileRepository.save(profile);
            }
        });
    }

    private static LocalTime parseTime(String value, String field) {
        try {
            return LocalTime.parse(value);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid time for " + field + ": " + value);
        }
    }

    public static NotificationPreferenceDto toDto(NotificationPreference p) {
        return new NotificationPreferenceDto(
                p.isLearningRemindersEnabled(),
                p.isReviewRemindersEnabled(),
                p.isDailyPlanRemindersEnabled(),
                p.isExamRemindersEnabled(),
                p.isProgressNotificationsEnabled(),
                p.isMilestoneNotificationsEnabled(),
                p.isWeeklyProgressEnabled(),
                p.isQuietHoursEnabled(),
                format(p.getQuietHoursStart()),
                format(p.getQuietHoursEnd()),
                format(p.getPreferredReminderTime()),
                p.getTimezone()
        );
    }

    private static String format(LocalTime time) {
        return time != null ? time.format(HH_MM) : null;
    }
}
