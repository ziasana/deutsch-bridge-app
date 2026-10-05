package com.deutschbridge.backend.service.push;

import com.deutschbridge.backend.model.entity.Notification;

import java.util.List;

/** Published once the in-app notifications of one dispatch run exist, so they can also be pushed. */
public record NotificationsCreatedEvent(List<PushMessage> messages) {

    /** What a device needs to show a notification and, when tapped, find its in-app destination. */
    public record PushMessage(String userId, String notificationId, String title, String body, String actionUrl) {
        public static PushMessage of(Notification n) {
            return new PushMessage(n.getUserId(), n.getId(), n.getTitle(), n.getBody(), n.getActionUrl());
        }
    }

    public static NotificationsCreatedEvent of(List<Notification> notifications) {
        return new NotificationsCreatedEvent(notifications.stream().map(PushMessage::of).toList());
    }
}
