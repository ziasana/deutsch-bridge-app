package com.deutschbridge.backend.model.enums;

/** Not every notification reaches every state; a typical in-app path is SENT -> READ -> CLICKED -> COMPLETED.
 * EXPIRED means the learning opportunity went away (or its day ended) before the learner opened it. */
public enum NotificationStatus {
    CREATED,
    SCHEDULED,
    SENT,
    DELIVERED,
    READ,
    CLICKED,
    COMPLETED,
    EXPIRED,
    CANCELLED
}
