package com.deutschbridge.backend.model.examsim;

import com.deutschbridge.backend.model.enums.ExamPartModule;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.PartResultStatus;
import com.deutschbridge.backend.model.enums.PartScoringMethod;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Result of one part. score is null unless status is SCORED.
 *
 * @param method the effective scoring method (an oral part of a profile without oral scoring is UNSCORED)
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PartResult(
        String key,
        String label,
        ExamPartModule module,
        ExamSection section,
        int teil,
        PartScoringMethod method,
        BigDecimal maxPoints,
        BigDecimal score,
        PartResultStatus status,
        int totalQuestions,
        int correct,
        int incorrect,
        int unanswered,
        boolean completed,
        Map<String, BigDecimal> criteriaScores,
        String assessorComment
) {
}
