package com.deutschbridge.backend.model.dto;

import java.util.List;

public record RedemittelPageResponse(List<RedemittelDto> items, int page, int size, long totalElements, int totalPages) {
}
