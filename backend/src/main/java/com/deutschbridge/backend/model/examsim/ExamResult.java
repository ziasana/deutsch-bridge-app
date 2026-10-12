package com.deutschbridge.backend.model.examsim;

import com.deutschbridge.backend.model.enums.ExamResultStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.List;

/**
 * The calculated outcome of an attempt. Written, oral and overall results are deliberately separate.
 * A score is null while it cannot be stated; scoreSoFar fields only ever cover what has actually been scored.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ExamResult(
        BigDecimal writtenScore,
        BigDecimal writtenMax,
        BigDecimal writtenPercentage,
        boolean writtenComplete,
        BigDecimal writtenPassThreshold,
        ExamResultStatus writtenResult,
        boolean oralScoringEnabled,
        BigDecimal oralScore,
        BigDecimal oralMax,
        BigDecimal oralPassThreshold,
        ExamResultStatus oralResult,
        BigDecimal totalScore,
        BigDecimal totalMax,
        ExamResultStatus overallResult,
        String overallExplanation,
        List<PartResult> parts,
        List<String> pendingAssessmentParts,
        long computedAtMs
) {
}
