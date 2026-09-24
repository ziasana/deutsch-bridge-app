package com.deutschbridge.backend.model.dto;

import java.util.List;

public record AdminBroadcastPageResponse(
        List<NotificationBroadcastResponse> items,
        int page,
        int size,
        long totalElements,
        boolean hasNext
) {
}
