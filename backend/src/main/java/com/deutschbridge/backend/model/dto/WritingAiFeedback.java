package com.deutschbridge.backend.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

/** AI analysis of a learner's text. Lists are capped so the learner gets priorities, not 20 corrections. */
public record WritingAiFeedback(
        List<String> positives,
        /** Task points that are missing or weak. */
        List<String> missingPoints,
        List<GrammarFix> grammar,
        List<String> vocabulary,
        List<String> structure,
        /** One concrete improved sentence/passage, or null. */
        String improvementExample
) {
    public record GrammarFix(String original, String corrected, String explanation) {
    }

    @JsonIgnore
    public boolean isEmpty() {
        return positives.isEmpty() && missingPoints.isEmpty() && grammar.isEmpty() && vocabulary.isEmpty()
                && structure.isEmpty() && (improvementExample == null || improvementExample.isBlank());
    }
}
