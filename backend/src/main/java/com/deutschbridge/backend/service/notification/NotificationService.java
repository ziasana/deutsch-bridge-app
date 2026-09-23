package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.NotificationAnalyticsResponse;
import com.deutschbridge.backend.model.dto.NotificationPageResponse;
import com.deutschbridge.backend.model.dto.NotificationResponse;
import com.deutschbridge.backend.model.entity.Notification;
import com.deutschbridge.backend.model.enums.NotificationCategory;
import com.deutschbridge.backend.model.enums.NotificationStatus;
import com.deutschbridge.backend.model.enums.NotificationType;
import com.deutschbridge.backend.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * The learner's in-app notification center: listing, unread count, read/click tracking - plus the
 * admin funnel analytics aggregated from the same rows. Deciding *whether* to notify lives in
 * NotificationDispatchService; this class only manages notifications that already exist.
 */
@Service
public class NotificationService {

    /** Statuses a learner can see. CREATED/SCHEDULED aren't delivered yet; EXPIRED/CANCELLED are withdrawn. */
    public static final Set<NotificationStatus> VISIBLE_STATUSES = EnumSet.of(
            NotificationStatus.SENT,
            NotificationStatus.DELIVERED,
            NotificationStatus.READ,
            NotificationStatus.CLICKED,
            NotificationStatus.COMPLETED
    );
    private static final int MAX_PAGE_SIZE = 50;
    private static final String NOT_FOUND_MSG = "Notification not found!";

    private final NotificationRepository notificationRepository;
    private final NotificationEventTracker events;
    private final Clock clock;

    public NotificationService(NotificationRepository notificationRepository,
                               NotificationEventTracker events,
                               Clock clock) {
        this.notificationRepository = notificationRepository;
        this.events = events;
        this.clock = clock;
    }

    public NotificationPageResponse list(String userId, int page, int size,
                                         Collection<NotificationCategory> categories, boolean unreadOnly) {
        int safeSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        boolean allCategories = categories == null || categories.isEmpty();
        Page<Notification> result = notificationRepository.findVisible(
                userId,
                VISIBLE_STATUSES,
                allCategories,
                allCategories ? List.of(NotificationCategory.values()) : categories,
                unreadOnly,
                PageRequest.of(Math.max(page, 0), safeSize));

        return new NotificationPageResponse(
                result.getContent().stream().map(NotificationResponse::fromEntity).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.hasNext());
    }

    public long unreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadAtIsNullAndStatusIn(userId, VISIBLE_STATUSES);
    }

    @Transactional
    public NotificationResponse markRead(String userId, String id) throws DataNotFoundException {
        Notification n = findOwned(userId, id);
        markRead(n, Instant.now(clock));
        return NotificationResponse.fromEntity(notificationRepository.save(n));
    }

    @Transactional
    public int markAllRead(String userId) {
        return notificationRepository.markAllRead(userId, VISIBLE_STATUSES, Instant.now(clock));
    }

    /** A click reads the notification, records clickedAt and hands back the structured destination. */
    @Transactional
    public NotificationResponse click(String userId, String id) throws DataNotFoundException {
        Notification n = findOwned(userId, id);
        Instant now = Instant.now(clock);
        markRead(n, now);
        if (n.getClickedAt() == null) {
            n.setClickedAt(now);
            events.track(NotificationEventTracker.CLICKED, n);
            events.track(NotificationEventTracker.LEARNING_STARTED, n);
        }
        if (n.getStatus() != NotificationStatus.COMPLETED) {
            n.setStatus(NotificationStatus.CLICKED);
        }
        return NotificationResponse.fromEntity(notificationRepository.save(n));
    }

    public NotificationAnalyticsResponse analytics(int days) {
        int safeDays = Math.clamp(days, 1, 365);
        Instant since = Instant.now(clock).minus(Duration.ofDays(safeDays));

        List<NotificationAnalyticsResponse.FunnelRow> rows = new ArrayList<>();
        long sent = 0;
        long opened = 0;
        long clicked = 0;
        long completed = 0;
        for (Object[] row : notificationRepository.aggregateFunnelByType(since)) {
            NotificationType type = (NotificationType) row[0];
            long s = ((Number) row[1]).longValue();
            long o = ((Number) row[2]).longValue();
            long c = ((Number) row[3]).longValue();
            long d = ((Number) row[4]).longValue();
            rows.add(NotificationAnalyticsResponse.FunnelRow.of(type.name(), s, o, c, d));
            sent += s;
            opened += o;
            clicked += c;
            completed += d;
        }
        rows.sort((a, b) -> Long.compare(b.sent(), a.sent()));
        return new NotificationAnalyticsResponse(safeDays,
                NotificationAnalyticsResponse.FunnelRow.of("ALL", sent, opened, clicked, completed), rows);
    }

    private void markRead(Notification n, Instant now) {
        if (n.getReadAt() != null) return;
        n.setReadAt(now);
        if (n.getStatus() == NotificationStatus.SENT || n.getStatus() == NotificationStatus.DELIVERED) {
            n.setStatus(NotificationStatus.READ);
        }
        events.track(NotificationEventTracker.READ, n);
    }

    private Notification findOwned(String userId, String id) throws DataNotFoundException {
        return notificationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
    }
}
