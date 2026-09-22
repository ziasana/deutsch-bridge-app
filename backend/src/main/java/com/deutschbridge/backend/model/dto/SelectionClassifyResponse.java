package com.deutschbridge.backend.model.dto;

/** {@code type} is "WORD" or "EXPRESSION". */
public record SelectionClassifyResponse(String type, String normalizedText, String meaning, String example) {
}
