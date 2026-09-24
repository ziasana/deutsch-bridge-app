package com.deutschbridge.backend.model.dto;

import java.util.List;

public record AdminBulkDeleteUsersRequest(
        List<String> ids
) {
}
