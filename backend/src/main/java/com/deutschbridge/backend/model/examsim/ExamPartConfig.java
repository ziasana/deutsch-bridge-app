package com.deutschbridge.backend.model.examsim;

import com.deutschbridge.backend.model.enums.ExamPartModule;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.PartScoringMethod;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.List;

/**
 * One required part of the exam (list order = exam order).
 *
 * @param key             stable identifier within the profile, e.g. LESEN_1
 * @param section         exercise section the content is drawn from
 * @param teil            Teil number as resolved by ExamTeilResolver
 * @param taskTypes       eligible task types; null/empty = any
 * @param exerciseCount   number of distinct exercises combined into this part
 * @param questionCount   total number of scored questions across the part's exercises (PER_QUESTION only)
 * @param pointsPerQuestion points per correct answer (PER_QUESTION only)
 * @param maxPoints       maximum points of the part
 * @param timerKey        the timer (stage) this part belongs to
 * @param rubric          assessment criteria (MANUAL_RUBRIC only)
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ExamPartConfig(
        String key,
        String label,
        ExamPartModule module,
        ExamSection section,
        int teil,
        List<ExamTaskType> taskTypes,
        int exerciseCount,
        Integer questionCount,
        BigDecimal pointsPerQuestion,
        BigDecimal maxPoints,
        PartScoringMethod scoringMethod,
        String timerKey,
        List<RubricCriterion> rubric
) {
    public int effectiveExerciseCount() {
        return exerciseCount > 0 ? exerciseCount : 1;
    }

    public List<RubricCriterion> rubricOrEmpty() {
        return rubric != null ? rubric : List.of();
    }
}
