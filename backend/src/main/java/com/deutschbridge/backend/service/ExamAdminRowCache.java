package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.ExamExerciseAdminRow;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

/**
 * The admin list rows of every exam exercise, sorted by title and cached as one entry (a separate bean so the cache proxy applies).
 * Cleared by the same {@code examAdminList} evictions as every exam exercise write.
 */
@Component
@RequiredArgsConstructor
class ExamAdminRowCache {

    private final ExamExerciseRepository examExerciseRepository;

    @Cacheable(cacheNames = "examAdminList", key = "'ALL'")
    public List<ExamExerciseAdminRow> allRows() {
        return examExerciseRepository.findAll().stream()
                .sorted(Comparator.comparing(ExamExercise::getTitle, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .map(ExamExerciseService::toAdminRow)
                .toList();
    }
}
