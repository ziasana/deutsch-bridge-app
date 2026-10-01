package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.CurrentFocusDto;
import com.deutschbridge.backend.model.dto.WritingProgressResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class DashboardWritingFocusTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 15, 12, 0);

    private WritingProgressResponse progress(LocalDateTime last, int count) {
        return new WritingProgressResponse(3, 1, 1, 100, last,
                List.of(new WritingProgressResponse.Issue("STRUCTURE", "Textaufbau", count)), List.of());
    }

    @Test
    @DisplayName("a repeated, recent writing problem becomes the focus")
    void recurringRecentIssue() {
        Optional<CurrentFocusDto> focus = DashboardService.writingFocus(progress(NOW.minusDays(2), 3), NOW);
        assertEquals("WRITING", focus.orElseThrow().area());
        assertEquals("STRUCTURE", focus.get().detail());
    }

    @Test
    @DisplayName("a one-off problem does not take over the focus")
    void singleOccurrence() {
        assertTrue(DashboardService.writingFocus(progress(NOW.minusDays(1), 1), NOW).isEmpty());
    }

    @Test
    @DisplayName("stale writing activity does not take over the focus")
    void staleActivity() {
        assertTrue(DashboardService.writingFocus(progress(NOW.minusDays(30), 5), NOW).isEmpty());
    }

    @Test
    @DisplayName("no writing activity -> no writing focus")
    void noActivity() {
        assertTrue(DashboardService.writingFocus(
                new WritingProgressResponse(0, 0, 0, 0, null, List.of(), List.of()), NOW).isEmpty());
    }
}
