package com.deutschbridge.backend.model.enums;

/** When correct answers, explanations and transcripts may be returned to the learner. */
public enum AnswerReleasePolicy {
    /** Never: only scores are shown. */
    SCORE_ONLY,
    /** As soon as the attempt is finished. */
    AFTER_SUBMISSION,
    /** Once every manual assessment of the attempt is complete. */
    AFTER_ASSESSMENT
}
