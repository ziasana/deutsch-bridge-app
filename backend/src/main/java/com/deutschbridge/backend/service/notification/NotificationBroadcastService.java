package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AdminBroadcastPageResponse;
import com.deutschbridge.backend.model.dto.NotificationBroadcastRequest;
import com.deutschbridge.backend.model.dto.NotificationBroadcastResponse;
import com.deutschbridge.backend.model.entity.NotificationBroadcast;
import com.deutschbridge.backend.model.enums.AccountType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.NotificationAudienceType;
import com.deutschbridge.backend.model.enums.NotificationBroadcastStatus;
import com.deutschbridge.backend.model.enums.NotificationType;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import com.deutschbridge.backend.repository.NotificationBroadcastRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Set;

/** Admin compose/send/list/edit/cancel for manual notification broadcasts. */
@Service
public class NotificationBroadcastService {

    private static final Set<NotificationType> MANUAL_TYPES =
            Set.of(NotificationType.ANNOUNCEMENT, NotificationType.SYSTEM_MESSAGE, NotificationType.PROMOTION);
    private static final int MAX_PAGE_SIZE = 50;
    private static final String NOT_FOUND_MSG = "Notification broadcast not found!";

    private final NotificationBroadcastRepository broadcastRepository;
    private final AudienceResolverService audienceResolverService;
    private final NotificationBroadcastDispatchService dispatchService;
    private final Clock clock;

    public NotificationBroadcastService(NotificationBroadcastRepository broadcastRepository,
                                        AudienceResolverService audienceResolverService,
                                        NotificationBroadcastDispatchService dispatchService,
                                        Clock clock) {
        this.broadcastRepository = broadcastRepository;
        this.audienceResolverService = audienceResolverService;
        this.dispatchService = dispatchService;
        this.clock = clock;
    }

    public AdminBroadcastPageResponse list(int page, int size) {
        int safeSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        Page<NotificationBroadcast> result = broadcastRepository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(Math.max(page, 0), safeSize));
        return new AdminBroadcastPageResponse(
                result.getContent().stream().map(NotificationBroadcastResponse::fromEntity).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.hasNext());
    }

    @Transactional
    public NotificationBroadcastResponse create(NotificationBroadcastRequest request, String adminId, String adminEmail) {
        NotificationBroadcast broadcast = new NotificationBroadcast();
        broadcast.setCreatedBy(adminId);
        broadcast.setCreatedByEmail(adminEmail);
        applyFields(broadcast, request);
        return NotificationBroadcastResponse.fromEntity(dispatchIfDue(broadcast));
    }

    @Transactional
    public NotificationBroadcastResponse update(String id, NotificationBroadcastRequest request) throws DataNotFoundException {
        NotificationBroadcast broadcast = find(id);
        requireEditable(broadcast);
        applyFields(broadcast, request);
        return NotificationBroadcastResponse.fromEntity(dispatchIfDue(broadcast));
    }

    @Transactional
    public void cancel(String id) throws DataNotFoundException {
        NotificationBroadcast broadcast = find(id);
        requireEditable(broadcast);
        broadcast.setStatus(NotificationBroadcastStatus.CANCELLED);
        broadcastRepository.save(broadcast);
    }

    public long audienceCount(NotificationAudienceType audienceType, LearningLevel level, AccountType accountType, PreferredLanguage language) {
        return audienceResolverService.resolveUserIds(audienceType, level, accountType, language, List.of()).size();
    }

    private NotificationBroadcast dispatchIfDue(NotificationBroadcast broadcast) {
        broadcast.setStatus(NotificationBroadcastStatus.SCHEDULED);
        if (broadcast.getScheduledAt() == null || !broadcast.getScheduledAt().isAfter(Instant.now(clock))) {
            return dispatchService.send(broadcastRepository.save(broadcast));
        }
        return broadcastRepository.save(broadcast);
    }

    private void applyFields(NotificationBroadcast broadcast, NotificationBroadcastRequest request) {
        NotificationType type = parseType(request.type());
        NotificationAudienceType audienceType = NotificationAudienceType.valueOf(request.audienceType());

        broadcast.setTitle(request.title());
        broadcast.setMessage(request.message());
        broadcast.setType(type);
        broadcast.setAudienceType(audienceType);
        broadcast.setAudienceLevel(request.audienceLevel() != null ? LearningLevel.valueOf(request.audienceLevel()) : null);
        broadcast.setAudienceAccountType(request.audienceAccountType() != null ? AccountType.valueOf(request.audienceAccountType()) : null);
        broadcast.setAudienceLanguage(request.audienceLanguage() != null ? PreferredLanguage.valueOf(request.audienceLanguage()) : null);
        broadcast.setAudienceUserIds(request.audienceUserIds() != null ? request.audienceUserIds() : List.of());
        broadcast.setScheduledAt(request.scheduledAt());

        if (audienceType == NotificationAudienceType.LEVEL && broadcast.getAudienceLevel() == null) {
            throw new IllegalArgumentException("audienceLevel is required for audienceType LEVEL");
        }
        if (audienceType == NotificationAudienceType.ACCOUNT_TYPE && broadcast.getAudienceAccountType() == null) {
            throw new IllegalArgumentException("audienceAccountType is required for audienceType ACCOUNT_TYPE");
        }
        if (audienceType == NotificationAudienceType.LANGUAGE && broadcast.getAudienceLanguage() == null) {
            throw new IllegalArgumentException("audienceLanguage is required for audienceType LANGUAGE");
        }
        if (audienceType == NotificationAudienceType.SPECIFIC_USERS && broadcast.getAudienceUserIds().isEmpty()) {
            throw new IllegalArgumentException("audienceUserIds is required for audienceType SPECIFIC_USERS");
        }
    }

    private NotificationType parseType(String type) {
        NotificationType parsed;
        try {
            parsed = NotificationType.valueOf(type);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown notification type: " + type);
        }
        if (!MANUAL_TYPES.contains(parsed)) {
            throw new IllegalArgumentException("Type must be one of " + MANUAL_TYPES);
        }
        return parsed;
    }

    private void requireEditable(NotificationBroadcast broadcast) {
        if (broadcast.getStatus() != NotificationBroadcastStatus.SCHEDULED) {
            throw new IllegalArgumentException("Only a still-scheduled broadcast can be edited or cancelled.");
        }
    }

    private NotificationBroadcast find(String id) throws DataNotFoundException {
        return broadcastRepository.findById(id).orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
    }
}
