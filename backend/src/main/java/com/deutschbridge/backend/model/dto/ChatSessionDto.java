package com.deutschbridge.backend.model.dto;

import java.time.LocalDateTime;

public record ChatSessionDto(String id, String userId, String title, LocalDateTime createdAt) {
}
