package com.deutschbridge.backend.model.dto;

/** area is one of VOCABULARY, GRAMMAR, READING, EXPRESSIONS, or null when no reliable comparison exists. */
public record CurrentFocusDto(
        String area,
        String route
) {
}
