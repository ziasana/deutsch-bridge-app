package com.deutschbridge.backend.model.dto;

import java.util.List;

public record PracticeSessionResponse(
        List<PracticeExpressionDto> items,
        int newCount,
        int reviewCount
) {
}
