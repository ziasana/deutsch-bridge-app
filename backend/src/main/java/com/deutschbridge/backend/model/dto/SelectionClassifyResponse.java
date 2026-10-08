package com.deutschbridge.backend.model.dto;

/**
 * {@code type} is "WORD" or "EXPRESSION"; {@code wordType} is a VocabularyWordType name (part of speech
 * or expression kind) and {@code synonyms} a comma-separated list - both may be empty/null.
 */
public record SelectionClassifyResponse(String type, String normalizedText, String meaning, String example,
                                        String wordType, String synonyms) {
}
