package com.deutschbridge.backend.service.push;

import com.deutschbridge.backend.model.entity.PushDevice;
import com.deutschbridge.backend.repository.PushDeviceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Pushes freshly created in-app notifications to the learners' devices through Expo's push service.
 * The in-app notification stays the source of truth: a failed or disabled push never affects it.
 * Delivery runs after the creating transaction committed (so a tap can always resolve the
 * notification) and off the caller's thread (a broadcast must not wait on a third-party API).
 */
@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);
    /** Expo accepts at most 100 messages per request. */
    static final int BATCH_SIZE = 100;
    static final String DEVICE_NOT_REGISTERED = "DeviceNotRegistered";

    private final PushDeviceRepository deviceRepository;
    private final RestClient restClient;
    private final boolean enabled;

    public PushNotificationService(PushDeviceRepository deviceRepository,
                                   RestClient.Builder restClientBuilder,
                                   @Value("${notifications.push.enabled:false}") boolean enabled,
                                   @Value("${notifications.push.expo-url:https://exp.host/--/api/v2/push/send}") String expoUrl,
                                   @Value("${notifications.push.access-token:}") String accessToken) {
        this.deviceRepository = deviceRepository;
        this.enabled = enabled;
        RestClient.Builder builder = restClientBuilder.baseUrl(expoUrl).defaultHeader("Accept", "application/json");
        if (!accessToken.isBlank()) builder.defaultHeader("Authorization", "Bearer " + accessToken);
        this.restClient = builder.build();
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onNotificationsCreated(NotificationsCreatedEvent event) {
        if (!enabled || event.messages().isEmpty()) return;
        try {
            send(event.messages());
        } catch (RuntimeException e) {
            log.warn("Push delivery failed: {}", e.getMessage());
        }
    }

    void send(List<NotificationsCreatedEvent.PushMessage> messages) {
        Set<String> userIds = messages.stream().map(NotificationsCreatedEvent.PushMessage::userId).collect(Collectors.toSet());
        Map<String, List<PushDevice>> devicesByUser = deviceRepository.findByUserIdIn(userIds).stream()
                .collect(Collectors.groupingBy(PushDevice::getUserId));

        List<Map<String, Object>> payloads = new ArrayList<>();
        for (NotificationsCreatedEvent.PushMessage m : messages) {
            for (PushDevice device : devicesByUser.getOrDefault(m.userId(), List.of())) {
                payloads.add(payload(device.getToken(), m));
            }
        }

        Set<String> dead = new HashSet<>();
        for (int from = 0; from < payloads.size(); from += BATCH_SIZE) {
            List<Map<String, Object>> batch = payloads.subList(from, Math.min(from + BATCH_SIZE, payloads.size()));
            dead.addAll(deliver(batch));
        }
        if (!dead.isEmpty()) deviceRepository.deleteByTokenIn(dead);
    }

    static Map<String, Object> payload(String token, NotificationsCreatedEvent.PushMessage m) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("notificationId", m.notificationId());
        if (m.actionUrl() != null) data.put("actionUrl", m.actionUrl());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("to", token);
        payload.put("title", m.title());
        if (m.body() != null) payload.put("body", m.body());
        payload.put("sound", "default");
        payload.put("channelId", "default");
        payload.put("data", data);
        return payload;
    }

    /** @return tokens Expo reports as no longer valid (app uninstalled / notifications revoked). */
    @SuppressWarnings("unchecked")
    private Set<String> deliver(List<Map<String, Object>> batch) {
        Map<String, Object> response = restClient.post()
                .contentType(MediaType.APPLICATION_JSON)
                .body(batch)
                .retrieve()
                .body(Map.class);

        Set<String> dead = new HashSet<>();
        Object data = response == null ? null : response.get("data");
        if (!(data instanceof List<?> tickets)) return dead;
        for (int i = 0; i < tickets.size() && i < batch.size(); i++) {
            if (!(tickets.get(i) instanceof Map<?, ?> ticket) || !"error".equals(ticket.get("status"))) continue;
            Object details = ticket.get("details");
            String error = details instanceof Map<?, ?> d ? String.valueOf(d.get("error")) : null;
            if (DEVICE_NOT_REGISTERED.equals(error)) dead.add((String) batch.get(i).get("to"));
            else log.warn("Expo rejected a push: {}", ticket.get("message"));
        }
        return dead;
    }
}
