package com.deutschbridge.backend.model.enums;

/** How a part is turned into points. Scorers are looked up by this value, so new methods need no conditionals elsewhere. */
public enum PartScoringMethod {
    /** Points per correct answer, taken from the stored answer key. */
    PER_QUESTION,
    /** Points awarded by an assessor against the part's rubric; awaiting assessment until then. */
    MANUAL_RUBRIC,
    /** Completed/not completed only, no points. */
    UNSCORED
}
