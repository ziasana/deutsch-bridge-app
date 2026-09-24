package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.entity.Notification;
import com.deutschbridge.backend.model.entity.NotificationBroadcast;
import com.deutschbridge.backend.model.enums.NotificationBroadcastStatus;
import com.deutschbridge.backend.model.enums.NotificationStatus;
import com.deutschbridge.backend.repository.NotificationBroadcastRepository;
import com.deutschbridge.backend.repository.NotificationRepository;
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
    private final Clock clock;

    public NotificationBroadcastDispatchService(AudienceResolverService audienceResolverService,
                                                NotificationRepository notificationRepository,
                                                NotificationBroadcastRepository broadcastRepository,
                                                Clock clock) {
        this.audienceResolverService = audienceResolverService;
        this.notificationRepository = notificationRepository;
        this.broadcastRepository = broadcastRepository;
        this.clock = clock;
    }

    @Transactional
    public NotificationBroadcast send(NotificationBroadcast broadcast) {
        List<String> userIds = audienceResolverService.resolveUserIds(
                broadcast.getAudienceType(), broadcast.getAudienceLevel(),
                broadcast.getAudienceAccountType(), broadcast.getAudienceLanguage(), broadcast.getAudienceUserIds());

        Instant now = Instant.now(clock);
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
        notificationRepository.saveAll(notifications);

        broadcast.setStatus(NotificationBroadcastStatus.SENT);
        broadcast.setSentAt(now);
        broadcast.setRecipientCount(userIds.size());
        return broadcastRepository.save(broadcast);
    }
}
