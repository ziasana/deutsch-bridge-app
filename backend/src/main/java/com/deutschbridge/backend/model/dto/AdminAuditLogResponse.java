package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.AdminAuditLog;

import java.time.Instant;

public record AdminAuditLogResponse(
        String id,
        String adminEmail,
        String action,
        String details,
        Instant createdAt
) {
    public static AdminAuditLogResponse fromEntity(AdminAuditLog log) {
        return new AdminAuditLogResponse(log.getId(), log.getAdminEmail(), log.getAction(), log.getDetails(), log.getCreatedAt());
    }
}
