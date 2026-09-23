package com.deutschbridge.backend.model.dto;

import java.util.List;

public record NotificationPageResponse(
        List<NotificationResponse> items,
        int page,
        int size,
        long totalElements,
        boolean hasNext
) {
}
