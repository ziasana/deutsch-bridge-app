package com.deutschbridge.backend.service.notification;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.*;

class NotificationPolicyTest {

    private static final LocalTime QUIET_START = LocalTime.of(22, 0);
    private static final LocalTime QUIET_END = LocalTime.of(8, 0);

    // ---------------------------------------------------------------
    // Quiet hours
    // ---------------------------------------------------------------
    @Test
    @DisplayName("quiet hours -> 23:00 and 07:59 are inside a 22:00-08:00 window")
    void insideOvernightQuietHours() {
        assertTrue(NotificationPolicy.isInQuietHours(LocalTime.of(23, 0), QUIET_START, QUIET_END));
        assertTrue(NotificationPolicy.isInQuietHours(LocalTime.of(7, 59), QUIET_START, QUIET_END));
        assertTrue(NotificationPolicy.isInQuietHours(LocalTime.of(22, 0), QUIET_START, QUIET_END));
    }

    @Test
    @DisplayName("quiet hours -> 08:00 and 18:30 are outside a 22:00-08:00 window")
    void outsideOvernightQuietHours() {
        assertFalse(NotificationPolicy.isInQuietHours(LocalTime.of(8, 0), QUIET_START, QUIET_END));
        assertFalse(NotificationPolicy.isInQuietHours(LocalTime.of(18, 30), QUIET_START, QUIET_END));
    }

    @Test
    @DisplayName("quiet hours -> same-day window (13:00-15:00) works too; equal bounds mean none")
    void sameDayAndEmptyWindows() {
        assertTrue(NotificationPolicy.isInQuietHours(LocalTime.of(14, 0), LocalTime.of(13, 0), LocalTime.of(15, 0)));
        assertFalse(NotificationPolicy.isInQuietHours(LocalTime.of(16, 0), LocalTime.of(13, 0), LocalTime.of(15, 0)));
        assertFalse(NotificationPolicy.isInQuietHours(LocalTime.of(14, 0), LocalTime.of(9, 0), LocalTime.of(9, 0)));
    }

    // ---------------------------------------------------------------
    // Frequency
    // ---------------------------------------------------------------
    @Test
    @DisplayName("frequency -> with limit 2: 0 and 1 sent are allowed, 2 is blocked")
    void frequencyLimit() {
        assertTrue(NotificationPolicy.withinLimit(0, 2));
        assertTrue(NotificationPolicy.withinLimit(1, 2));
        assertFalse(NotificationPolicy.withinLimit(2, 2));
    }

    @Test
    @DisplayName("frequency -> a learner override can lower but never raise the global limit")
    void effectiveLimit() {
        assertEquals(2, NotificationPolicy.effectiveLimit(null, 2));
        assertEquals(1, NotificationPolicy.effectiveLimit(1, 2));
        assertEquals(2, NotificationPolicy.effectiveLimit(5, 2));
    }

    // ---------------------------------------------------------------
    // Timezone
    // ---------------------------------------------------------------
    @Test
    @DisplayName("timezone -> missing or invalid zones fall back to Europe/Berlin, not the server zone")
    void resolveZoneFallback() {
        assertEquals(ZoneId.of("Europe/Berlin"), NotificationPolicy.resolveZone(null));
        assertEquals(ZoneId.of("Europe/Berlin"), NotificationPolicy.resolveZone("Mars/Olympus"));
        assertEquals(ZoneId.of("UTC"), NotificationPolicy.resolveZone("UTC"));
        assertFalse(NotificationPolicy.isValidZone("Mars/Olympus"));
    }

    @Test
    @DisplayName("timezone -> the learner's 'today' starts at their own local midnight (Berlin, UTC, Tehran)")
    void localDayBoundaries() {
        // 2026-09-23 21:30 UTC is already 2026-09-24 in Tehran (UTC+3:30) but still the 23rd in Berlin (UTC+2).
        Instant now = Instant.parse("2026-09-23T21:30:00Z");

        assertEquals(Instant.parse("2026-09-22T22:00:00Z"), NotificationPolicy.startOfLocalDay(now, ZoneId.of("Europe/Berlin")));
        assertEquals(Instant.parse("2026-09-23T00:00:00Z"), NotificationPolicy.startOfLocalDay(now, ZoneId.of("UTC")));
        assertEquals(Instant.parse("2026-09-23T20:30:00Z"), NotificationPolicy.startOfLocalDay(now, ZoneId.of("Asia/Tehran")));
        assertEquals(Instant.parse("2026-09-24T20:30:00Z"), NotificationPolicy.startOfNextLocalDay(now, ZoneId.of("Asia/Tehran")));
    }
}
