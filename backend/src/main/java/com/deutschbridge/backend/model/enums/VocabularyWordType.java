package com.deutschbridge.backend.model.enums;

import java.util.Locale;

/**
 * Part of speech of a vocabulary entry, or - for saved phrases - the kind of expression:
 * EXPRESSION (Wendung / Kollokation), IDIOM (Redewendung), NOUN_VERB_CONNECTION (Nomen-Verb-Verbindung).
 */
public enum VocabularyWordType {
    NOUN,
    VERB,
    ADJECTIVE,
    ADVERB,
    PREPOSITION,
    CONJUNCTION,
    PRONOUN,
    OTHER,
    EXPRESSION,
    IDIOM,
    NOUN_VERB_CONNECTION;

    /**
     * Finds the type in a free-text AI answer (it may add punctuation or a short explanation).
     * Longer names are checked first so NOUN_VERB_CONNECTION is not read as NOUN.
     */
    public static VocabularyWordType fromAiAnswer(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String text = raw.toUpperCase(Locale.ROOT).replace('-', '_');
        return java.util.Arrays.stream(values())
                .sorted(java.util.Comparator.comparingInt((VocabularyWordType t) -> t.name().length()).reversed())
                .filter(t -> java.util.regex.Pattern.compile("\\b" + t.name() + "\\b").matcher(text).find())
                .findFirst()
                .orElse(null);
    }

    /** Lenient parse of what the AI or a client sent; null for blank or unknown values. */
    public static VocabularyWordType parse(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_'));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
