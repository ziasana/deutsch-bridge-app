package com.deutschbridge.backend.service.cache;

import com.deutschbridge.backend.model.dto.ExamLevelSummaryResponse;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import com.deutschbridge.backend.repository.ExamLevelAggregateProjection;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Caches per-user exam progress aggregates - unlike ContentCacheService (shared, content-only
 * caches), these entries are keyed by userId and must be evicted whenever that user's completion
 * state changes (see the @CacheEvict annotations in ExamExerciseService).
 */
@Service
public class ExamProgressCacheService {

    private final ExamExerciseRepository examExerciseRepository;

    public ExamProgressCacheService(ExamExerciseRepository examExerciseRepository) {
        this.examExerciseRepository = examExerciseRepository;
    }

    @Cacheable(cacheNames = "examLevelSummary", key = "#userId")
    public List<ExamLevelSummaryResponse> getLevelSummary(String userId) {
        return examExerciseRepository.aggregateByLevelForUser(userId).stream()
                .map(ExamProgressCacheService::toResponse)
                .toList();
    }

    private static ExamLevelSummaryResponse toResponse(ExamLevelAggregateProjection row) {
        int avgScore = row.getAvgScore() != null ? (int) Math.round(row.getAvgScore()) : 0;
        return new ExamLevelSummaryResponse(row.getLevel(), row.getTotal(), row.getMastered(), avgScore);
    }
}
