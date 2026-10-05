package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.entity.Notification;
import com.deutschbridge.backend.model.entity.NotificationBroadcast;
import com.deutschbridge.backend.model.enums.NotificationBroadcastStatus;
import com.deutschbridge.backend.model.enums.NotificationStatus;
import com.deutschbridge.backend.repository.NotificationBroadcastRepository;
import com.deutschbridge.backend.repository.NotificationRepository;
import com.deutschbridge.backend.service.push.NotificationsCreatedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

/** Fans an admin NotificationBroadcast out into one Notification row per resolved recipient. */
@Service
public class NotificationBroadcastDispatchService {

    private final AudienceResolverService audienceResolverService;
    private final NotificationRepository notificationRepository;
    private final NotificationBroadcastRepository broadcastRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final Clock clock;

    public NotificationBroadcastDispatchService(AudienceResolverService audienceResolverService,
                                                NotificationRepository notificationRepository,
                                                NotificationBroadcastRepository broadcastRepository,
                                                ApplicationEventPublisher eventPublisher,
                                                Clock clock) {
        this.audienceResolverService = audienceResolverService;
        this.notificationRepository = notificationRepository;
        this.broadcastRepository = broadcastRepository;
        this.eventPublisher = eventPublisher;
        this.clock = clock;
    }

    /**
     * Resolves the audience and creates one Notification per recipient, but only if this broadcast is
     * still SCHEDULED at the moment of the atomic claim below. An admin's "edit and send now" and the
     * scheduler's dispatchDueBroadcasts() can both reach this method for the same broadcast; the claim
     * guarantees only the winner does the work, so the loser returns the broadcast unchanged instead of
     * racing to insert duplicate Notification rows (which would previously surface as a confusing 409).
     */
    @Transactional
    public NotificationBroadcast send(NotificationBroadcast broadcast) {
        Instant now = Instant.now(clock);
        if (broadcastRepository.claimForSending(broadcast.getId(), now) == 0) {
            return broadcastRepository.findById(broadcast.getId()).orElse(broadcast);
        }

        List<String> userIds = audienceResolverService.resolveUserIds(
                broadcast.getAudienceType(), broadcast.getAudienceLevel(),
                broadcast.getAudienceAccountType(), broadcast.getAudienceLanguage(), broadcast.getAudienceUserIds());

        List<Notification> notifications = userIds.stream().map(userId -> {
            Notification n = new Notification();
            n.setUserId(userId);
            n.setType(broadcast.getType());
            n.setCategory(broadcast.getType().getCategory());
            n.setPriority(broadcast.getType().getDefaultPriority());
            n.setTitle(broadcast.getTitle());
            n.setBody(broadcast.getMessage());
            n.setDedupKey("broadcast:" + broadcast.getId() + ":" + userId);
            n.setStatus(NotificationStatus.SENT);
            n.setSentAt(now);
            return n;
        }).toList();
        List<Notification> saved = notificationRepository.saveAll(notifications);
        eventPublisher.publishEvent(NotificationsCreatedEvent.of(saved));

        broadcast.setStatus(NotificationBroadcastStatus.SENT);
        broadcast.setSentAt(now);
        broadcast.setRecipientCount(userIds.size());
        broadcast.setLastDispatchError(null);
        return broadcastRepository.save(broadcast);
    }
}
