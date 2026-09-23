package com.deutschbridge.backend.service.notification;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

/**
 * Pure, stateless decision helpers (quiet hours, limits, timezones) kept free of Spring and the
 * database so the rules the plan cares most about can be unit-tested directly.
 */
public final class NotificationPolicy {

    public static final ZoneId DEFAULT_ZONE = ZoneId.of("Europe/Berlin");

    private NotificationPolicy() {
    }

    /**
     * Whether {@code localTime} falls inside [start, end). Handles windows that wrap past midnight
     * (e.g. 22:00-08:00). An empty window (start == end) means no quiet hours.
     */
    public static boolean isInQuietHours(LocalTime localTime, LocalTime start, LocalTime end) {
        if (start == null || end == null || start.equals(end)) return false;
        if (start.isBefore(end)) {
            return !localTime.isBefore(start) && localTime.isBefore(end);
        }
        return !localTime.isBefore(start) || localTime.isBefore(end);
    }

    /** A learner override can only lower the admin's global limit. */
    public static int effectiveLimit(Integer userLimit, int globalLimit) {
        if (userLimit == null || userLimit < 0) return globalLimit;
        return Math.min(userLimit, globalLimit);
    }

    public static boolean withinLimit(long sentToday, int limit) {
        return sentToday < limit;
    }

    /** Falls back to the default zone for missing or invalid ids rather than the server's own zone. */
    public static ZoneId resolveZone(String timezone) {
        if (timezone == null || timezone.isBlank()) return DEFAULT_ZONE;
        try {
            return ZoneId.of(timezone);
        } catch (Exception e) {
            return DEFAULT_ZONE;
        }
    }

    public static boolean isValidZone(String timezone) {
        if (timezone == null || timezone.isBlank()) return false;
        try {
            ZoneId.of(timezone);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /** Start of the learner's current local day, as an Instant. */
    public static Instant startOfLocalDay(Instant now, ZoneId zone) {
        return now.atZone(zone).toLocalDate().atStartOfDay(zone).toInstant();
    }

    public static Instant startOfNextLocalDay(Instant now, ZoneId zone) {
        LocalDate tomorrow = now.atZone(zone).toLocalDate().plusDays(1);
        return tomorrow.atStartOfDay(zone).toInstant();
    }
}
