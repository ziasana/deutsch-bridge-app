package com.deutschbridge.backend.service.cache;

import com.deutschbridge.backend.model.dto.GrammarLevelSummaryResponse;
import com.deutschbridge.backend.model.enums.GrammarLessonStatus;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import com.deutschbridge.backend.repository.LevelCountProjection;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Caches per-user grammar progress aggregates - keyed by userId and evicted whenever that user's
 * learned state for a lesson changes (LearningProgressService.save) or any lesson/category is
 * written (see EvictGrammarCaches).
 */
@Service
public class GrammarProgressCacheService {

    private final GrammarLessonRepository grammarLessonRepository;

    public GrammarProgressCacheService(GrammarLessonRepository grammarLessonRepository) {
        this.grammarLessonRepository = grammarLessonRepository;
    }

    @Cacheable(cacheNames = "grammarLevelSummary", key = "#userId")
    public List<GrammarLevelSummaryResponse> getLevelSummary(String userId) {
        Map<LearningLevel, Long> learnedByLevel = grammarLessonRepository
                .countLearnedByLevelForUser(userId, GrammarLessonStatus.PUBLISHED).stream()
                .collect(Collectors.toMap(LevelCountProjection::getLevel, LevelCountProjection::getTotal));

        return grammarLessonRepository.countByLevel(GrammarLessonStatus.PUBLISHED).stream()
                .sorted(Comparator.comparing(row -> row.getLevel().ordinal()))
                .map(row -> new GrammarLevelSummaryResponse(
                        row.getLevel().getValue(),
                        row.getTotal(),
                        learnedByLevel.getOrDefault(row.getLevel(), 0L)))
                .toList();
    }
}
