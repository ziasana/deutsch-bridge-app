package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.enums.NotificationType;
import com.deutschbridge.backend.service.AppSettingService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Admin-controlled, global notification configuration, persisted in the generic app_settings store.
 * Defaults come from the implementation plan: 2 learning + 1 reminder notification per day, reminders
 * at 18:30, quiet hours 22:00-08:00. Per-learner preferences can only narrow these, never widen them.
 */
@Service
public class NotificationSettingsService {

    static final String ENABLED_KEY = "notifications.enabled";
    static final String MAX_LEARNING_KEY = "notifications.max-learning-per-day";
    static final String MAX_REMINDER_KEY = "notifications.max-reminder-per-day";
    static final String DEFAULT_REMINDER_TIME_KEY = "notifications.default-reminder-time";
    static final String QUIET_START_KEY = "notifications.quiet-hours-start";
    static final String QUIET_END_KEY = "notifications.quiet-hours-end";
    static final String MIN_GAP_KEY = "notifications.min-gap-minutes";
    static final String TEST_MODE_KEY = "notifications.test-mode.enabled";
    static final String TEST_EMAILS_KEY = "notifications.test-mode.emails";
    private static final String TYPE_KEY_PREFIX = "notifications.type.";

    public static final int DEFAULT_MAX_LEARNING = 2;
    public static final int DEFAULT_MAX_REMINDER = 1;
    public static final int DEFAULT_MIN_GAP_MINUTES = 180;
    public static final LocalTime DEFAULT_REMINDER_TIME = LocalTime.of(18, 30);
    public static final LocalTime DEFAULT_QUIET_START = LocalTime.of(22, 0);
    public static final LocalTime DEFAULT_QUIET_END = LocalTime.of(8, 0);

    /** The types that have rules today and can therefore be switched on/off by the admin. */
    public static final List<NotificationType> MANAGED_TYPES = List.of(
            NotificationType.REVIEW_DUE,
            NotificationType.DAILY_WORDS_READY,
            NotificationType.DAILY_PLAN_INCOMPLETE,
            NotificationType.CONTINUE_LEARNING,
            NotificationType.MILESTONE_REACHED
    );

    public record GlobalSettings(
            boolean enabled,
            int maxLearningPerDay,
            int maxReminderPerDay,
            LocalTime defaultReminderTime,
            LocalTime quietHoursStart,
            LocalTime quietHoursEnd,
            Map<NotificationType, Boolean> typeEnabled,
            int minGapMinutes,
            boolean testModeEnabled,
            List<String> testUserEmails
    ) {
        public boolean isTypeEnabled(NotificationType type) {
            return typeEnabled.getOrDefault(type, true);
        }

        /** Test mode only ever applies to the explicitly listed test learners. */
        public boolean isTestUser(String email) {
            return testModeEnabled && email != null && testUserEmails.contains(email.strip().toLowerCase(Locale.ROOT));
        }
    }

    private final AppSettingService appSettingService;

    public NotificationSettingsService(AppSettingService appSettingService) {
        this.appSettingService = appSettingService;
    }

    @PostConstruct
    public void seedDefaults() {
        appSettingService.seedIfMissing(ENABLED_KEY, "true", "Master switch for all learner notifications.");
        appSettingService.seedIfMissing(MAX_LEARNING_KEY, String.valueOf(DEFAULT_MAX_LEARNING), "Maximum learning notifications per learner per day.");
        appSettingService.seedIfMissing(MAX_REMINDER_KEY, String.valueOf(DEFAULT_MAX_REMINDER), "Maximum reminder notifications per learner per day.");
        appSettingService.seedIfMissing(DEFAULT_REMINDER_TIME_KEY, DEFAULT_REMINDER_TIME.toString(), "Default preferred reminder time for new learners.");
        appSettingService.seedIfMissing(QUIET_START_KEY, DEFAULT_QUIET_START.toString(), "Default quiet hours start for new learners.");
        appSettingService.seedIfMissing(QUIET_END_KEY, DEFAULT_QUIET_END.toString(), "Default quiet hours end for new learners.");
        for (NotificationType type : MANAGED_TYPES) {
            appSettingService.seedIfMissing(typeKey(type), "true", "Enables " + type + " notifications.");
        }
        appSettingService.seedIfMissing(MIN_GAP_KEY, String.valueOf(DEFAULT_MIN_GAP_MINUTES), "Minimum minutes between two learning/reminder notifications.");
        appSettingService.seedIfMissing(TEST_MODE_KEY, "false", "Lets admins trigger notifications for test learners, ignoring timing rules.");
        appSettingService.seedIfMissing(TEST_EMAILS_KEY, "-", "Comma-separated test learner emails for notification test mode.");
    }

    public GlobalSettings get() {
        Map<NotificationType, Boolean> types = new EnumMap<>(NotificationType.class);
        for (NotificationType type : MANAGED_TYPES) {
            types.put(type, appSettingService.getBoolean(typeKey(type), true));
        }
        return new GlobalSettings(
                appSettingService.getBoolean(ENABLED_KEY, true),
                Math.max(0, appSettingService.getInt(MAX_LEARNING_KEY, DEFAULT_MAX_LEARNING)),
                Math.max(0, appSettingService.getInt(MAX_REMINDER_KEY, DEFAULT_MAX_REMINDER)),
                getTime(DEFAULT_REMINDER_TIME_KEY, DEFAULT_REMINDER_TIME),
                getTime(QUIET_START_KEY, DEFAULT_QUIET_START),
                getTime(QUIET_END_KEY, DEFAULT_QUIET_END),
                types,
                Math.max(0, appSettingService.getInt(MIN_GAP_KEY, DEFAULT_MIN_GAP_MINUTES)),
                appSettingService.getBoolean(TEST_MODE_KEY, false),
                parseEmails(appSettingService.getString(TEST_EMAILS_KEY, ""))
        );
    }

    public GlobalSettings update(GlobalSettings settings) {
        if (settings.maxLearningPerDay() < 0 || settings.maxReminderPerDay() < 0 || settings.minGapMinutes() < 0) {
            throw new IllegalArgumentException("Limits cannot be negative.");
        }
        appSettingService.setValue(ENABLED_KEY, String.valueOf(settings.enabled()));
        appSettingService.setValue(MAX_LEARNING_KEY, String.valueOf(settings.maxLearningPerDay()));
        appSettingService.setValue(MAX_REMINDER_KEY, String.valueOf(settings.maxReminderPerDay()));
        appSettingService.setValue(DEFAULT_REMINDER_TIME_KEY, settings.defaultReminderTime().toString());
        appSettingService.setValue(QUIET_START_KEY, settings.quietHoursStart().toString());
        appSettingService.setValue(QUIET_END_KEY, settings.quietHoursEnd().toString());
        appSettingService.setValue(MIN_GAP_KEY, String.valueOf(settings.minGapMinutes()));
        appSettingService.setValue(TEST_MODE_KEY, String.valueOf(settings.testModeEnabled()));
        List<String> emails = settings.testUserEmails() == null ? List.of() : settings.testUserEmails();
        // app_settings values are NOT NULL; "-" stands for "no test learners".
        appSettingService.setValue(TEST_EMAILS_KEY, emails.isEmpty() ? "-" : String.join(",", parseEmails(String.join(",", emails))));
        settings.typeEnabled().forEach((type, enabled) -> {
            if (MANAGED_TYPES.contains(type)) {
                appSettingService.setValue(typeKey(type), String.valueOf(enabled));
            }
        });
        return get();
    }

    static List<String> parseEmails(String raw) {
        if (raw == null) return List.of();
        return Arrays.stream(raw.split("[,\\s;]+"))
                .map(e -> e.strip().toLowerCase(Locale.ROOT))
                .filter(e -> e.contains("@"))
                .distinct()
                .toList();
    }

    private LocalTime getTime(String key, LocalTime defaultValue) {
        try {
            return LocalTime.parse(appSettingService.getString(key, defaultValue.toString()));
        } catch (DateTimeParseException e) {
            return defaultValue;
        }
    }

    private static String typeKey(NotificationType type) {
        return TYPE_KEY_PREFIX + type.name() + ".enabled";
    }
}
