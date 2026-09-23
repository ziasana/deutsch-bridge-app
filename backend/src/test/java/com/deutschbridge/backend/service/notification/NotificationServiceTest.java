package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.NotificationResponse;
import com.deutschbridge.backend.model.entity.Notification;
import com.deutschbridge.backend.model.enums.NotificationCategory;
import com.deutschbridge.backend.model.enums.NotificationPriority;
import com.deutschbridge.backend.model.enums.NotificationStatus;
import com.deutschbridge.backend.model.enums.NotificationType;
import com.deutschbridge.backend.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    private static final Instant NOW = Instant.parse("2026-09-23T17:00:00Z");

    @Mock
    private NotificationRepository repository;
    @Mock
    private NotificationEventTracker events;

    private NotificationService service;

    @BeforeEach
    void setUp() {
        service = new NotificationService(repository, events, Clock.fixed(NOW, ZoneOffset.UTC));
        lenient().when(repository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static Notification reviewNotification() {
        Notification n = new Notification();
        n.setId("ntf-1");
        n.setUserId("user-1");
        n.setType(NotificationType.REVIEW_DUE);
        n.setCategory(NotificationCategory.LEARNING);
        n.setPriority(NotificationPriority.HIGH);
        n.setTitle("8 words");
        n.setEntityType("VOCABULARY_REVIEW");
        n.setActionUrl("/dashboard/vocabulary/practice");
        n.setStatus(NotificationStatus.SENT);
        n.setSentAt(NOW.minusSeconds(600));
        return n;
    }

    @Test
    @DisplayName("deep link -> click marks read, records clickedAt and returns the structured route")
    void clickNavigatesToActionUrl() throws DataNotFoundException {
        Notification n = reviewNotification();
        when(repository.findByIdAndUserId("ntf-1", "user-1")).thenReturn(Optional.of(n));

        NotificationResponse response = service.click("user-1", "ntf-1");

        assertEquals("/dashboard/vocabulary/practice", response.actionUrl());
        assertEquals("VOCABULARY_REVIEW", response.entityType());
        assertTrue(response.read());
        assertEquals(NotificationStatus.CLICKED, n.getStatus());
        assertEquals(NOW, n.getReadAt());
        assertEquals(NOW, n.getClickedAt());
        verify(events).track(NotificationEventTracker.CLICKED, n);
    }

    @Test
    @DisplayName("a second click doesn't overwrite the first click time")
    void secondClickKeepsFirstTimestamp() throws DataNotFoundException {
        Notification n = reviewNotification();
        Instant firstClick = NOW.minusSeconds(120);
        n.setReadAt(firstClick);
        n.setClickedAt(firstClick);
        when(repository.findByIdAndUserId("ntf-1", "user-1")).thenReturn(Optional.of(n));

        service.click("user-1", "ntf-1");

        assertEquals(firstClick, n.getClickedAt());
        verify(events, never()).track(eq(NotificationEventTracker.CLICKED), any());
    }

    @Test
    @DisplayName("mark read -> SENT becomes READ; another learner's notification is not found")
    void markRead() throws DataNotFoundException {
        Notification n = reviewNotification();
        when(repository.findByIdAndUserId("ntf-1", "user-1")).thenReturn(Optional.of(n));
        when(repository.findByIdAndUserId("ntf-1", "user-2")).thenReturn(Optional.empty());

        service.markRead("user-1", "ntf-1");

        assertEquals(NotificationStatus.READ, n.getStatus());
        assertEquals(NOW, n.getReadAt());
        assertThrows(DataNotFoundException.class, () -> service.markRead("user-2", "ntf-1"));
    }

    private static <T> T eq(T value) {
        return org.mockito.ArgumentMatchers.eq(value);
    }
}
