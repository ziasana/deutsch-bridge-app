package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AdminWritingGuideItemDto;
import com.deutschbridge.backend.model.dto.AdminWritingGuideItemRow;
import com.deutschbridge.backend.model.dto.AdminWritingPhraseDto;
import com.deutschbridge.backend.model.dto.AdminWritingPhraseRow;
import com.deutschbridge.backend.model.entity.WritingGuideItem;
import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.WritingGuideKind;
import com.deutschbridge.backend.repository.RedemittelExerciseRepository;
import com.deutschbridge.backend.repository.RedemittelFunctionRepository;
import com.deutschbridge.backend.repository.WritingGuideItemRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.deutschbridge.backend.service.cache.RedemittelCacheService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

/** Admin CRUD for the data-driven "Schreiben lernen" content (guide items and Redemittel). */
@Service
public class WritingContentAdminService {

    private final WritingGuideItemRepository guideRepository;
    private final WritingPhraseRepository phraseRepository;
    private final RedemittelExerciseRepository exerciseRepository;
    private final RedemittelFunctionRepository functionRepository;
    private final ObjectMapper objectMapper;

    public WritingContentAdminService(WritingGuideItemRepository guideRepository,
                                      WritingPhraseRepository phraseRepository,
                                      RedemittelExerciseRepository exerciseRepository,
                                      RedemittelFunctionRepository functionRepository,
                                      ObjectMapper objectMapper) {
        this.functionRepository = functionRepository;
        this.exerciseRepository = exerciseRepository;
        this.guideRepository = guideRepository;
        this.phraseRepository = phraseRepository;
        this.objectMapper = objectMapper;
    }

    // ---- guide items ----

    /**
     * Light rows narrowed by any of the optional filters (null/blank = no filter; search matches the title).
     * Cached per filter combination and cleared by every guide item write.
     */
    @Cacheable(cacheNames = "writingGuideAdminList", key = "{#level, #kind, #active, #search}")
    public List<AdminWritingGuideItemRow> listGuideItemRows(LearningLevel level, WritingGuideKind kind, Boolean active, String search) {
        String query = search == null ? "" : search.trim().toLowerCase();
        return guideRepository.findAll().stream()
                .filter(i -> level == null || i.getLevel() == level)
                .filter(i -> kind == null || i.getKind() == kind)
                .filter(i -> active == null || i.isActive() == active)
                .filter(i -> query.isEmpty() || (i.getTitle() != null && i.getTitle().toLowerCase().contains(query)))
                .sorted(Comparator.comparing(WritingGuideItem::getKind).thenComparingInt(WritingGuideItem::getSortOrder))
                .map(i -> new AdminWritingGuideItemRow(i.getId(), i.getLevel(), i.getKind(), i.getTitle(), i.getSortOrder(), i.isActive()))
                .toList();
    }

    public AdminWritingGuideItemDto getGuideItem(String id) throws DataNotFoundException {
        return toDto(guideRepository.findById(id).orElseThrow(() -> new DataNotFoundException("Guide item not found!")));
    }

    @CacheEvict(cacheNames = "writingGuideAdminList", allEntries = true)
    public AdminWritingGuideItemDto createGuideItem(AdminWritingGuideItemDto dto) {
        return toDto(guideRepository.save(apply(new WritingGuideItem(), dto)));
    }

    @CacheEvict(cacheNames = "writingGuideAdminList", allEntries = true)
    public AdminWritingGuideItemDto updateGuideItem(String id, AdminWritingGuideItemDto dto) throws DataNotFoundException {
        WritingGuideItem item = guideRepository.findById(id).orElseThrow(() -> new DataNotFoundException("Guide item not found!"));
        return toDto(guideRepository.save(apply(item, dto)));
    }

    @CacheEvict(cacheNames = "writingGuideAdminList", allEntries = true)
    public void deleteGuideItem(String id) throws DataNotFoundException {
        if (!guideRepository.existsById(id)) throw new DataNotFoundException("Guide item not found!");
        guideRepository.deleteById(id);
    }

    private WritingGuideItem apply(WritingGuideItem item, AdminWritingGuideItemDto dto) {
        if (dto.level() == null || dto.kind() == null || dto.title() == null || dto.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Level, kind and title are required.");
        }
        item.setLevel(dto.level());
        item.setKind(dto.kind());
        item.setTitle(dto.title().strip());
        item.setContent(dto.content() == null || dto.content().isBlank() ? null : dto.content());
        item.setData(dto.data() == null || dto.data().isNull() ? null : dto.data().toString());
        item.setSortOrder(dto.sortOrder());
        item.setActive(dto.active());
        return item;
    }

    private AdminWritingGuideItemDto toDto(WritingGuideItem i) {
        JsonNode data = null;
        if (i.getData() != null) {
            try {
                data = objectMapper.readTree(i.getData());
            } catch (Exception ignored) {
                // Unreadable legacy JSON is shown as empty so the admin can overwrite it.
            }
        }
        return new AdminWritingGuideItemDto(i.getId(), i.getLevel(), i.getKind(), i.getTitle(), i.getContent(), data,
                i.getSortOrder(), i.isActive());
    }

    // ---- phrases ----

    /**
     * Light rows (with each phrase's exercise count) narrowed by any of the optional filters
     * (null/blank = no filter; category is a Funktion id; search matches the phrase text). Cached per
     * filter combination and cleared by every phrase or exercise write.
     */
    @Cacheable(cacheNames = RedemittelCacheService.ADMIN_LIST_CACHE, key = "{#level, #category, #active, #search}")
    public List<AdminWritingPhraseRow> listPhraseRows(LearningLevel level, String category, Boolean active, String search) {
        String query = search == null ? "" : search.trim().toLowerCase();
        Map<String, Long> exerciseCounts = new HashMap<>();
        for (Object[] row : exerciseRepository.countByPhrase()) exerciseCounts.put((String) row[0], (Long) row[1]);
        return phraseRepository.findAll().stream()
                .filter(p -> level == null || p.getLevel() == level)
                .filter(p -> category == null || category.isBlank() || category.equals(p.getCategory().getId()))
                .filter(p -> active == null || p.isActive() == active)
                .filter(p -> query.isEmpty() || (p.getPhrase() != null && p.getPhrase().toLowerCase().contains(query)))
                .sorted(Comparator.comparingInt((WritingPhrase p) -> p.getCategory().getSortOrder())
                        .thenComparing(p -> p.getCategory().getLabel())
                        .thenComparingInt(WritingPhrase::getSortOrder))
                .map(p -> new AdminWritingPhraseRow(p.getId(), p.getLevel(), p.getCategory().getId(), p.getPhrase(),
                        p.isActive(), p.getSortOrder(), exerciseCounts.getOrDefault(p.getId(), 0L)))
                .toList();
    }

    public AdminWritingPhraseDto getPhrase(String id) throws DataNotFoundException {
        return toDto(phraseRepository.findById(id).orElseThrow(() -> new DataNotFoundException("Phrase not found!")));
    }

    @CacheEvict(cacheNames = {RedemittelCacheService.PHRASE_CACHE, RedemittelCacheService.LIST_CACHE, RedemittelCacheService.HUB_CACHE, RedemittelCacheService.EXERCISE_CACHE,
            RedemittelCacheService.ADMIN_LIST_CACHE}, allEntries = true)
    public AdminWritingPhraseDto createPhrase(AdminWritingPhraseDto dto) {
        return toDto(phraseRepository.save(apply(new WritingPhrase(), dto)));
    }

    @CacheEvict(cacheNames = {RedemittelCacheService.PHRASE_CACHE, RedemittelCacheService.LIST_CACHE, RedemittelCacheService.HUB_CACHE, RedemittelCacheService.EXERCISE_CACHE,
            RedemittelCacheService.ADMIN_LIST_CACHE}, allEntries = true)
    public AdminWritingPhraseDto updatePhrase(String id, AdminWritingPhraseDto dto) throws DataNotFoundException {
        WritingPhrase phrase = phraseRepository.findById(id).orElseThrow(() -> new DataNotFoundException("Phrase not found!"));
        return toDto(phraseRepository.save(apply(phrase, dto)));
    }

    @CacheEvict(cacheNames = {RedemittelCacheService.PHRASE_CACHE, RedemittelCacheService.LIST_CACHE, RedemittelCacheService.HUB_CACHE, RedemittelCacheService.EXERCISE_CACHE,
            RedemittelCacheService.ADMIN_LIST_CACHE}, allEntries = true)
    public void deletePhrase(String id) throws DataNotFoundException {
        if (!phraseRepository.existsById(id)) throw new DataNotFoundException("Phrase not found!");
        exerciseRepository.deleteByPhraseId(id);
        phraseRepository.deleteById(id);
    }

    private WritingPhrase apply(WritingPhrase p, AdminWritingPhraseDto dto) {
        if (dto.level() == null || dto.category() == null || dto.phrase() == null || dto.phrase().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Level, category and phrase are required.");
        }
        p.setLevel(dto.level());
        p.setCategory(functionRepository.findById(dto.category())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown function.")));
        p.setPhrase(dto.phrase().strip());
        p.setExplanation(blankToNull(dto.explanation()));
        p.setExample(blankToNull(dto.example()));
        p.setFormality(dto.formality());
        p.setUsageNote(blankToNull(dto.usageNote()));
        p.setSortOrder(dto.sortOrder());
        p.setActive(dto.active());
        p.setMeaningEn(blankToNull(dto.meaningEn()));
        p.setMeaningFa(blankToNull(dto.meaningFa()));
        p.setGrammarPattern(blankToNull(dto.grammarPattern()));
        p.setCommonMistake(blankToNull(dto.commonMistake()));
        p.setSimilarExpressions(RedemittelText.joinLines(dto.similarExpressions()));
        p.setContexts(RedemittelText.joinContexts(dto.contexts()));
        return p;
    }

    private AdminWritingPhraseDto toDto(WritingPhrase p) {
        return new AdminWritingPhraseDto(p.getId(), p.getLevel(), p.getCategory().getId(), p.getPhrase(), p.getExplanation(),
                p.getExample(), p.getFormality(), p.getUsageNote(), p.getSortOrder(), p.isActive(),
                p.getMeaningEn(), p.getMeaningFa(), p.getGrammarPattern(), p.getCommonMistake(),
                RedemittelText.splitLines(p.getSimilarExpressions()), RedemittelText.splitContexts(p.getContexts()));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
