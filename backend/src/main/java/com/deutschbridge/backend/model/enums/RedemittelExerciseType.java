package com.deutschbridge.backend.model.enums;

/**
 * Practice exercise types. MEANING, FILL_BLANK, SITUATION and PRODUCTION are written by an admin
 * per Redemittel; FUNCTION, CLOZE and WORD_ORDER are derived from the Redemittel's own category,
 * phrase and example sentence (see {@link #isDerived()}), so they need no extra authoring.
 * Roughly from easier to harder: recognize, recall, build, produce.
 */
public enum RedemittelExerciseType {
    MEANING,
    FUNCTION,
    FILL_BLANK,
    CLOZE,
    SITUATION,
    WORD_ORDER,
    PRODUCTION;

    public boolean isDerived() {
        return this == FUNCTION || this == CLOZE || this == WORD_ORDER;
    }

    /** The difficulty tier a type belongs to, represented by its authored type (the practice mix is defined per tier). */
    public RedemittelExerciseType tier() {
        return switch (this) {
            case MEANING, FUNCTION -> MEANING;
            case FILL_BLANK, CLOZE -> FILL_BLANK;
            case SITUATION, WORD_ORDER -> SITUATION;
            case PRODUCTION -> PRODUCTION;
        };
    }
}
