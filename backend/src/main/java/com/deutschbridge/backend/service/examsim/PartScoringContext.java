package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.ExamProfileConfig;
import com.deutschbridge.backend.model.examsim.ExerciseSnapshot;
import com.deutschbridge.backend.model.enums.PartScoringMethod;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Input of a single part scorer.
 *
 * @param method     effective scoring method of the part for this attempt
 * @param answers    question id to the stored answer
 * @param assessment the official (MANUAL) assessment of the part, or null
 */
public record PartScoringContext(
        ExamProfileConfig config,
        ExamPartConfig part,
        PartScoringMethod method,
        List<ExerciseSnapshot> exercises,
        Map<String, String> answers,
        boolean completed,
        Assessment assessment
) {
    /** Official assessment values of a manually assessed part. */
    public record Assessment(boolean assessed, BigDecimal points, Map<String, BigDecimal> criteriaScores, String comment) {
    }
}
