package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.AiGenerationException;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.SelectionClassifyResponse;
import com.deutschbridge.backend.model.dto.VocabularyCreateRequest;
import com.deutschbridge.backend.model.dto.VocabularyExistsResponse;
import com.deutschbridge.backend.model.dto.VocabularyFromChatCreateRequest;
import com.deutschbridge.backend.model.dto.VocabularyItemResponse;
import com.deutschbridge.backend.model.dto.VocabularyUpdateRequest;
import com.deutschbridge.backend.model.entity.DictionaryEntry;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.VocabularyBookmark;
import com.deutschbridge.backend.model.entity.VocabularyItem;
import com.deutschbridge.backend.model.entity.VocabularyProgress;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.VocabularySource;
import com.deutschbridge.backend.repository.DictionaryEntryRepository;
import com.deutschbridge.backend.repository.VocabularyBookmarkRepository;
import com.deutschbridge.backend.repository.VocabularyItemRepository;
import com.deutschbridge.backend.repository.VocabularyProgressRepository;
import com.deutschbridge.backend.util.VocabularyMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * CRUD + bookmarking for the unified VocabularyItem model, replacing the old
 * Vocabulary/VocabularyContent (custom words) and UserVocab (dictionary saves) services. Practice
 * session/round handling lives in VocabularyPracticeService instead.
 */
@Service
public class VocabularyService {

    private static final String NOT_FOUND_MSG = "Vocabulary item not found!";

    private final VocabularyItemRepository vocabularyItemRepository;
    private final VocabularyProgressRepository vocabularyProgressRepository;
    private final VocabularyBookmarkRepository vocabularyBookmarkRepository;
    private final DictionaryEntryRepository dictionaryEntryRepository;
    private final UserService userService;
    private final RequestContext requestContext;
    private final OllamaService ollamaService;
    private final ObjectMapper objectMapper;

    public VocabularyService(VocabularyItemRepository vocabularyItemRepository,
                              VocabularyProgressRepository vocabularyProgressRepository,
                              VocabularyBookmarkRepository vocabularyBookmarkRepository,
                              DictionaryEntryRepository dictionaryEntryRepository,
                              UserService userService,
                              RequestContext requestContext,
                              OllamaService ollamaService,
                              ObjectMapper objectMapper) {
        this.vocabularyItemRepository = vocabularyItemRepository;
        this.vocabularyProgressRepository = vocabularyProgressRepository;
        this.vocabularyBookmarkRepository = vocabularyBookmarkRepository;
        this.dictionaryEntryRepository = dictionaryEntryRepository;
        this.userService = userService;
        this.requestContext = requestContext;
        this.ollamaService = ollamaService;
        this.objectMapper = objectMapper;
    }

    // Not cached: scoped to the current user's own words/progress, so a shared cache key would
    // leak one user's vocabulary to another.
    public List<VocabularyItemResponse> findAllForUser(VocabularySource source, LearningLevel level, Boolean bookmarked) {
        User user = userService.findByEmail(requestContext.getUserEmail());
        List<VocabularyItem> items = vocabularyItemRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .filter(i -> source == null || i.getSource() == source)
                .filter(i -> level == null || i.getLevel() == level)
                .toList();

        Set<String> bookmarkedIds = bookmarkedItemIds(user, items);
        if (Boolean.TRUE.equals(bookmarked)) {
            items = items.stream().filter(i -> bookmarkedIds.contains(i.getId())).toList();
        }
        return mapWithCurrentUserProgress(user, items, bookmarkedIds);
    }

    public VocabularyItemResponse findById(String id) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        VocabularyItem item = ownedEntityById(user, id);
        return mapWithCurrentUserProgress(user, List.of(item), bookmarkedItemIds(user, List.of(item))).get(0);
    }

    @Transactional
    public VocabularyItemResponse createCustom(VocabularyCreateRequest request) {
        User user = userService.findByEmail(requestContext.getUserEmail());
        String word = normalize(request.word());
        String language = request.language() != null ? request.language() : requestContext.getLanguage();

        vocabularyItemRepository.findByUserAndWordIgnoreCaseAndLanguage(user, word, language)
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Vocabulary already exists for this word/language.");
                });

        String synonyms = ollamaService.generateAiSynonyms(word);

        VocabularyItem item = new VocabularyItem();
        item.setUser(user);
        item.setSource(VocabularySource.CUSTOM);
        item.setWord(word);
        item.setArticle(request.article());
        item.setMeaning(request.meaning());
        item.setLanguage(language);
        item.setExample(request.example());
        item.setSynonyms(synonyms);
        item.setLevel(request.level());
        item = vocabularyItemRepository.save(item);

        return VocabularyMapper.mapToResponse(item, null, false);
    }

    /** Same shape as createCustom, but source=AI_TUTOR and carries provenance back to the chat message
     *  it was selected from. */
    @Transactional
    public VocabularyItemResponse createFromChat(VocabularyFromChatCreateRequest request) {
        User user = userService.findByEmail(requestContext.getUserEmail());
        String word = normalize(request.word());
        String language = requestContext.getLanguage();

        vocabularyItemRepository.findByUserAndWordIgnoreCaseAndLanguage(user, word, language)
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Vocabulary already exists for this word/language.");
                });

        String synonyms = ollamaService.generateAiSynonyms(word);

        VocabularyItem item = new VocabularyItem();
        item.setUser(user);
        item.setSource(VocabularySource.AI_TUTOR);
        item.setWord(word);
        item.setMeaning(request.meaning());
        item.setLanguage(language);
        item.setExample(request.example());
        item.setSynonyms(synonyms);
        item.setLevel(request.level());
        item.setSourceChatId(request.sourceChatId());
        item.setSourceMessageId(request.sourceMessageId());
        item = vocabularyItemRepository.save(item);

        return VocabularyMapper.mapToResponse(item, null, false);
    }

    /** Classifies+normalizes a chat text selection via AI, falling back to a simple heuristic if the
     *  AI call fails or returns unparseable output - the confirmation modal lets the user fix it either way. */
    public SelectionClassifyResponse classifySelection(String selectedText, String contextText) {
        try {
            String raw = ollamaService.classifySelection(selectedText, contextText);
            JsonNode json = objectMapper.readTree(extractJson(raw));
            String type = json.path("type").asText("WORD");
            String normalizedText = json.path("normalizedText").asText(selectedText.trim());
            String meaning = json.path("meaning").asText("");
            String example = json.path("example").asText("");
            if (normalizedText.isBlank()) normalizedText = selectedText.trim();
            return new SelectionClassifyResponse("EXPRESSION".equalsIgnoreCase(type) ? "EXPRESSION" : "WORD",
                    normalizedText, meaning, example);
        } catch (RuntimeException | JsonProcessingException e) {
            return heuristicClassify(selectedText);
        }
    }

    /** The model is asked for a single-line JSON object but may still wrap it in prose/code fences. */
    private String extractJson(String raw) {
        int start = raw.indexOf('{');
        int end = raw.lastIndexOf('}');
        if (start == -1 || end == -1 || end < start) {
            throw new AiGenerationException("Classification response was not JSON.");
        }
        return raw.substring(start, end + 1);
    }

    private SelectionClassifyResponse heuristicClassify(String selectedText) {
        String trimmed = selectedText.trim();
        boolean isWord = trimmed.split("\\s+").length <= 1;
        return new SelectionClassifyResponse(isWord ? "WORD" : "EXPRESSION", trimmed, "", "");
    }

    public VocabularyExistsResponse checkExists(String word) {
        User user = userService.findByEmail(requestContext.getUserEmail());
        String language = requestContext.getLanguage();
        return vocabularyItemRepository.findByUserAndWordIgnoreCaseAndLanguage(user, normalize(word), language)
                .map(item -> new VocabularyExistsResponse(true, item.getId()))
                .orElseGet(() -> new VocabularyExistsResponse(false, null));
    }

    /** Replaces DictionaryService#saveToVocab - idempotent, re-adding an already-saved entry is a no-op. */
    public VocabularyItemResponse addFromDictionary(String dictionaryEntryId) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        DictionaryEntry entry = dictionaryEntryRepository.findById(dictionaryEntryId)
                .orElseThrow(() -> new DataNotFoundException("Dictionary entry not found!"));

        VocabularyItem item = vocabularyItemRepository.findByUserAndDictionaryEntry(user, entry)
                .orElseGet(() -> {
                    VocabularyItem created = new VocabularyItem();
                    created.setUser(user);
                    created.setSource(VocabularySource.DICTIONARY);
                    created.setDictionaryEntry(entry);
                    created.setWord(entry.getLemma());
                    created.setArticle(entry.getArticle());
                    created.setAudioUrl(entry.getAudioUrl());
                    created.setLanguage(requestContext.getLanguage());
                    created.setMeaning(firstMeaning(entry));
                    return created;
                });
        item = vocabularyItemRepository.save(item);

        return mapWithCurrentUserProgress(user, List.of(item), bookmarkedItemIds(user, List.of(item))).get(0);
    }

    public VocabularyItemResponse update(String id, VocabularyUpdateRequest request) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        VocabularyItem item = ownedEntityById(user, id);

        if (request.word() != null) item.setWord(normalize(request.word()));
        if (request.article() != null) item.setArticle(request.article());
        if (request.meaning() != null) item.setMeaning(request.meaning());
        if (request.language() != null) item.setLanguage(request.language());
        if (request.example() != null) item.setExample(request.example());
        if (request.level() != null) item.setLevel(request.level());
        item = vocabularyItemRepository.save(item);

        return mapWithCurrentUserProgress(user, List.of(item), bookmarkedItemIds(user, List.of(item))).get(0);
    }

    @Transactional
    public void delete(String id) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        VocabularyItem item = ownedEntityById(user, id);
        vocabularyBookmarkRepository.deleteByUserAndVocabularyItem(user, item);
        vocabularyProgressRepository.findByUserAndVocabularyItem(user, item).ifPresent(vocabularyProgressRepository::delete);
        vocabularyItemRepository.delete(item);
    }

    /** Idempotent - re-bookmarking is a no-op. */
    public VocabularyItemResponse addBookmark(String id) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        VocabularyItem item = ownedEntityById(user, id);
        if (!vocabularyBookmarkRepository.existsByUserAndVocabularyItem(user, item)) {
            VocabularyBookmark bookmark = new VocabularyBookmark();
            bookmark.setUser(user);
            bookmark.setVocabularyItem(item);
            vocabularyBookmarkRepository.save(bookmark);
        }
        return mapWithCurrentUserProgress(user, List.of(item), bookmarkedItemIds(user, List.of(item))).get(0);
    }

    public VocabularyItemResponse removeBookmark(String id) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        VocabularyItem item = ownedEntityById(user, id);
        vocabularyBookmarkRepository.deleteByUserAndVocabularyItem(user, item);
        return mapWithCurrentUserProgress(user, List.of(item), bookmarkedItemIds(user, List.of(item))).get(0);
    }

    private String firstMeaning(DictionaryEntry entry) {
        if (entry.getSenses() == null || entry.getSenses().isEmpty()) return null;
        var firstSense = entry.getSenses().get(0);
        if (firstSense.getTranslations() == null || firstSense.getTranslations().isEmpty()) return null;
        return firstSense.getTranslations().get(0);
    }

    private VocabularyItem ownedEntityById(User user, String id) throws DataNotFoundException {
        VocabularyItem item = vocabularyItemRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        if (item.getUser() == null || !item.getUser().getId().equals(user.getId())) {
            throw new DataNotFoundException(NOT_FOUND_MSG);
        }
        return item;
    }

    private Set<String> bookmarkedItemIds(User user, List<VocabularyItem> items) {
        if (items.isEmpty()) return Set.of();
        return vocabularyBookmarkRepository.findByUserAndVocabularyItemIn(user, items).stream()
                .map(b -> b.getVocabularyItem().getId())
                .collect(Collectors.toSet());
    }

    private List<VocabularyItemResponse> mapWithCurrentUserProgress(User user, List<VocabularyItem> items, Set<String> bookmarkedIds) {
        if (items.isEmpty()) return List.of();
        List<VocabularyProgress> progresses = vocabularyProgressRepository.findByUserAndVocabularyItemIn(user, items);
        Map<String, VocabularyProgress> progressByItemId = progresses.stream()
                .collect(Collectors.toMap(p -> p.getVocabularyItem().getId(), p -> p, (first, second) -> first));

        return items.stream()
                .map(i -> VocabularyMapper.mapToResponse(i, progressByItemId.get(i.getId()), bookmarkedIds.contains(i.getId())))
                .toList();
    }

    private String normalize(String word) {
        return word == null ? null : word.trim().toLowerCase();
    }
}
