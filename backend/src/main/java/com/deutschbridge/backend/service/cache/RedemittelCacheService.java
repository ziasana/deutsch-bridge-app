package com.deutschbridge.backend.service.cache;

import com.deutschbridge.backend.model.dto.RedemittelHubResponse;
import com.deutschbridge.backend.model.entity.RedemittelExercise;
import com.deutschbridge.backend.repository.RedemittelFunctionRepository;
import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.RedemittelExerciseRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Caches the shared, user-independent Redemittel content: the phrases (detail, unfiltered list pages,
 * hub counts) and the exercises of a phrase. The learner's own progress/collection is merged in by
 * the callers afterwards and is never cached. Exercises live in their own cache and are only read
 * when a practice/review session starts, so the browse pages never pay for them.
 *
 * Phrases and exercises have no lazy associations, so the cached objects are safe to use outside a
 * transaction. The admin write paths evict via @CacheEvict; the TTL in CacheConfig is a backstop only.
 */
@Service
public class RedemittelCacheService {

    public static final String PHRASE_CACHE = "redemittelPhrase";
    public static final String LIST_CACHE = "redemittelListPage";
    public static final String HUB_CACHE = "redemittelHubContent";
    public static final String EXERCISE_CACHE = "redemittelExercises";
    public static final String FUNCTION_CACHE = "redemittelFunctionLabels";

    private final WritingPhraseRepository phraseRepository;
    private final RedemittelExerciseRepository exerciseRepository;
    private final RedemittelFunctionRepository functionRepository;

    public RedemittelCacheService(WritingPhraseRepository phraseRepository, RedemittelExerciseRepository exerciseRepository,
                                  RedemittelFunctionRepository functionRepository) {
        this.phraseRepository = phraseRepository;
        this.exerciseRepository = exerciseRepository;
        this.functionRepository = functionRepository;
    }

    /** One active phrase; empty (and not cached) when it does not exist or is inactive. */
    @Cacheable(cacheNames = PHRASE_CACHE, unless = "#result == null")
    public Optional<WritingPhrase> getActivePhrase(String id) {
        return phraseRepository.findById(id).filter(WritingPhrase::isActive);
    }

    /** The authored exercises of one phrase, in the admin's order. */
    @Cacheable(EXERCISE_CACHE)
    public List<RedemittelExercise> getExercises(String phraseId) {
        return exerciseRepository.findByPhraseIdOrderBySortOrderAsc(phraseId);
    }

    /**
     * One page of active phrases for the browse list, without any per-user filter. search must already
     * be trimmed and lower-cased so equivalent searches share an entry.
     */
    @Cacheable(cacheNames = LIST_CACHE, key = "#level + ':' + #category + ':' + #search + ':' + #page + ':' + #size")
    public PhrasePage getListPage(LearningLevel level, String category, String search, int page, int size) {
        Page<WritingPhrase> result = phraseRepository.findStaticPage(
                level == null ? List.of(LearningLevel.values()) : List.of(level),
                category == null,
                category == null ? "" : category,
                "%" + search + "%",
                PageRequest.of(page, size));
        return new PhrasePage(result.getContent(), result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    /** Labels of all functions, used as distractors in the derived "Funktion" exercise. */
    @Cacheable(FUNCTION_CACHE)
    public List<String> getFunctionLabels() {
        return functionRepository.findAllByOrderBySortOrderAscLabelAsc().stream().map(f -> f.getLabel()).toList();
    }

    /** Active phrase count and per-category counts for the hub - no phrase rows loaded. */
    @Cacheable(HUB_CACHE)
    public HubContent getHubContent() {
        Map<String, Long> counts = new java.util.HashMap<>();
        for (Object[] row : phraseRepository.countActiveByCategory()) {
            counts.put((String) row[0], (Long) row[1]);
        }
        List<RedemittelHubResponse.Category> categories = functionRepository.findAllByOrderBySortOrderAscLabelAsc().stream()
                .filter(f -> counts.getOrDefault(f.getId(), 0L) > 0)
                .map(f -> new RedemittelHubResponse.Category(f.getId(), f.getLabel(), counts.get(f.getId())))
                .toList();
        return new HubContent(phraseRepository.countByActiveTrue(), categories);
    }

    public record PhrasePage(List<WritingPhrase> items, int page, int size, long totalElements, int totalPages) {
    }

    public record HubContent(long activeCount, List<RedemittelHubResponse.Category> categories) {
    }
}
