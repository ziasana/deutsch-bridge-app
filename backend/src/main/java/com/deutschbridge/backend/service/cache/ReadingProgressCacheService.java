package com.deutschbridge.backend.service.cache;

import com.deutschbridge.backend.model.dto.ReadingLevelSummaryResponse;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import com.deutschbridge.backend.repository.LevelCountProjection;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Caches per-user reading progress aggregates - keyed by userId and evicted whenever that user's
 * learned state for a reading changes (LearningProgressService.save) or any article is written
 * (ReadingArticleService admin paths).
 */
@Service
public class ReadingProgressCacheService {

    private final ReadingArticleRepository readingArticleRepository;

    public ReadingProgressCacheService(ReadingArticleRepository readingArticleRepository) {
        this.readingArticleRepository = readingArticleRepository;
    }

    @Cacheable(cacheNames = "readingLevelSummary", key = "#userId")
    public List<ReadingLevelSummaryResponse> getLevelSummary(String userId) {
        Map<LearningLevel, Long> learnedByLevel = readingArticleRepository.countLearnedByLevelForUser(userId).stream()
                .collect(Collectors.toMap(LevelCountProjection::getLevel, LevelCountProjection::getTotal));

        return readingArticleRepository.countByLevel().stream()
                .sorted(Comparator.comparing(row -> row.getLevel().ordinal()))
                .map(row -> new ReadingLevelSummaryResponse(
                        row.getLevel().getValue(),
                        row.getTotal(),
                        learnedByLevel.getOrDefault(row.getLevel(), 0L)))
                .toList();
    }
}
