package com.deutschbridge.backend.repository;

/** Row shape for ExamExerciseRepository.aggregateByLevelForUser's native SQL aggregate. */
public interface ExamLevelAggregateProjection {
    String getLevel();
    Long getTotal();
    Long getMastered();
    Double getAvgScore();
}
