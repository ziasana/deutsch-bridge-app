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
