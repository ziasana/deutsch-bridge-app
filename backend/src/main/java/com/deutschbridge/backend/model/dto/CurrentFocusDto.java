package com.deutschbridge.backend.model.dto;

/**
 * area is one of VOCABULARY, GRAMMAR, READING, EXPRESSIONS, WRITING, or null when no reliable comparison exists.
 * detail narrows the area where it helps (WRITING: the recurring problem dimension, e.g. STRUCTURE).
 */
public record CurrentFocusDto(
        String area,
        String route,
        String detail
) {
    public CurrentFocusDto(String area, String route) {
        this(area, route, null);
    }
}
