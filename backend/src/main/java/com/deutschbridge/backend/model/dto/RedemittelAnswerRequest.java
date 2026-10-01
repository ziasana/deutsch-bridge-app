package com.deutschbridge.backend.model.dto;

/** `answer` is the chosen option text (MEANING/SITUATION) or the learner's text (FILL_BLANK/PRODUCTION). */
public record RedemittelAnswerRequest(String exerciseId, String answer) {
}
