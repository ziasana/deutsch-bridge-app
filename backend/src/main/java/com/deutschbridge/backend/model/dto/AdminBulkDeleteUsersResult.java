package com.deutschbridge.backend.model.dto;

import java.util.List;

public record AdminBulkDeleteUsersResult(
        int totalCount,
        int successCount,
        int failureCount,
        List<AdminBulkDeleteUsersRowResult> rows
) {
}
