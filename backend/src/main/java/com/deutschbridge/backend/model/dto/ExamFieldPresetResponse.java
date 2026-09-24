package com.deutschbridge.backend.model.dto;

public record ExamFieldPresetResponse(
        String id,
        String section,
        String level,
        String fieldType,
        String label,
        String value
) {
}
