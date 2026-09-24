package com.deutschbridge.backend.model.dto;

public record AdminBulkDeleteUsersRowResult(
        String id,
        String email,
        boolean success,
        String errorMessage
) {
}
