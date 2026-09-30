package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ReadingArticleBulkImportResult;
import com.deutschbridge.backend.model.dto.ReadingArticleBulkImportRowResult;
import com.deutschbridge.backend.model.dto.ReadingArticleManualRequest;
import com.deutschbridge.backend.model.dto.ReadingArticleNavigationResponse;
import com.deutschbridge.backend.model.dto.ReadingArticleNeighborResponse;
import com.deutschbridge.backend.model.dto.ReadingArticlePageResponse;
import com.deutschbridge.backend.model.dto.ReadingArticleResponse;
import com.deutschbridge.backend.model.dto.ReadingArticleSummaryResponse;
import com.deutschbridge.backend.model.dto.ReadingLevelSummaryResponse;
import com.deutschbridge.backend.model.dto.ReadingViewCountResponse;
import com.deutschbridge.backend.model.entity.Annotation;
import com.deutschbridge.backend.model.entity.KeyVocabularyItem;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.ReadingArticle;
import com.deutschbridge.backend.model.entity.ReadingArticleBookmark;
import com.deutschbridge.backend.model.entity.ReadingCategory;
import com.deutschbridge.backend.model.entity.ReadingQuizQuestion;
import com.deutschbridge.backend.model.entity.Span;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserWordProgress;
import com.deutschbridge.backend.model.enums.AnnotationType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.ReadingQuizQuestionType;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import com.deutschbridge.backend.repository.ReadingArticleBookmarkRepository;
import com.deutschbridge.backend.repository.ReadingArticleListProjection;
import com.deutschbridge.backend.repository.ReadingArticleNeighborProjection;
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import com.deutschbridge.backend.repository.ReadingCategoryRepository;
import com.deutschbridge.backend.repository.UserArticleAttemptRepository;
import com.deutschbridge.backend.repository.UserWordProgressRepository;
import com.deutschbridge.backend.service.cache.ContentCacheService;
import com.deutschbridge.backend.service.cache.ReadingProgressCacheService;
import com.deutschbridge.backend.util.ReadingArticleMapper;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import jakarta.transaction.Transactional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ReadingArticleService {

    private static final String NOT_FOUND_MSG = "Reading article not found!";
    private static final String TITLE_MARKER = "TITEL:";
    private static final String TEXT_MARKER = "TEXT:";
    private static final String VOCAB_MARKER = "VOKABELN:";
    private static final String ANNOTATIONS_MARKER = "ANNOTATIONS:";
    private static final String QUIZ_MARKER = "QUIZ:";
    private static final int MAX_PAGE_SIZE = 50;

    private final ReadingArticleRepository readingArticleRepository;
    private final ReadingArticleBookmarkRepository readingArticleBookmarkRepository;
    private final ReadingCategoryRepository readingCategoryRepository;
    private final ReadingCategoryService readingCategoryService;
    private final LearningProgressRepository learningProgressRepository;
    private final UserArticleAttemptRepository userArticleAttemptRepository;
    private final UserWordProgressRepository userWordProgressRepository;
    private final UserService userService;
    private final RequestContext requestContext;
    private final OllamaService ollamaService;
    private final TokenizationService tokenizationService;
    private final ContentCacheService contentCacheService;
    private final ReadingProgressCacheService readingProgressCacheService;
    private final ObjectMapper objectMapper;
    private final FileStorageService fileStorageService;

    public ReadingArticleService(ReadingArticleRepository readingArticleRepository,
                                  ReadingArticleBookmarkRepository readingArticleBookmarkRepository,
                                  ReadingCategoryRepository readingCategoryRepository,
                                  ReadingCategoryService readingCategoryService,
                                  LearningProgressRepository learningProgressRepository,
                                  UserArticleAttemptRepository userArticleAttemptRepository,
                                  UserWordProgressRepository userWordProgressRepository,
                                  UserService userService,
                                  RequestContext requestContext,
                                  OllamaService ollamaService,
                                  TokenizationService tokenizationService,
                                  ContentCacheService contentCacheService,
                                  ReadingProgressCacheService readingProgressCacheService,
                                  ObjectMapper objectMapper,
                                  FileStorageService fileStorageService) {
        this.readingArticleRepository = readingArticleRepository;
        this.readingArticleBookmarkRepository = readingArticleBookmarkRepository;
        this.readingCategoryRepository = readingCategoryRepository;
        this.readingCategoryService = readingCategoryService;
        this.learningProgressRepository = learningProgressRepository;
        this.userArticleAttemptRepository = userArticleAttemptRepository;
        this.userWordProgressRepository = userWordProgressRepository;
        this.userService = userService;
        this.requestContext = requestContext;
        this.ollamaService = ollamaService;
        this.tokenizationService = tokenizationService;
        this.contentCacheService = contentCacheService;
        this.readingProgressCacheService = readingProgressCacheService;
        this.objectMapper = objectMapper;
        this.fileStorageService = fileStorageService;
    }

    public ReadingArticle findById(String id) throws DataNotFoundException {
        return readingArticleRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
    }

    /** Admin table: every article's full content, without any per-user progress. */
    public List<ReadingArticleResponse> findAllForAdmin() {
        return contentCacheService.getAllReadingArticles().stream()
                .map(a -> ReadingArticleMapper.mapToResponse(a, null, Set.of()))
                .toList();
    }

    /**
     * One page of a level's list. The common case (bookmarkedOnly=false) uses the shared cached
     * columns (keyed by level/search/categoryId/page/size) plus the current user's live learned/
     * new-word/bookmark state merged onto just this page's items. The "Bookmarked" filter changes
     * which rows belong on a page at all, so - exactly like expression's bookmark filter - it
     * bypasses the cache entirely and hits a live per-user-joined query instead, keeping the
     * WHERE/pagination in SQL. categoryId is null for "all categories".
     */
    public ReadingArticlePageResponse findPageWithLearningProgress(LearningLevel level, String search, boolean bookmarkedOnly,
                                                                     String categoryId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        String normalizedSearch = search != null ? search.trim().toLowerCase() : "";
        String normalizedCategoryId = categoryId != null && !categoryId.isBlank() ? categoryId : null;

        if (bookmarkedOnly) {
            User user = userService.findByEmail(requestContext.getUserEmail());
            return findBookmarkedPage(user, level, normalizedSearch, normalizedCategoryId, safePage, safeSize);
        }

        ContentCacheService.ReadingArticleListPage cached =
                contentCacheService.getReadingArticleListPage(level, normalizedSearch, normalizedCategoryId, safePage, safeSize);
        List<ContentCacheService.ReadingArticleListEntry> entries = cached.entries();
        if (entries.isEmpty()) {
            return new ReadingArticlePageResponse(List.of(), safePage, safeSize, cached.totalElements(), cached.totalPages());
        }

        User user = userService.findByEmail(requestContext.getUserEmail());
        List<String> ids = entries.stream().map(ContentCacheService.ReadingArticleListEntry::id).toList();
        Set<String> learnedIds = learningProgressRepository
                .findByUserAndReadingIdIn(user, ids)
                .stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsLearned()))
                .map(p -> p.getReading().getId())
                .collect(Collectors.toSet());
        Set<String> bookmarkedIds = readingArticleBookmarkRepository.findByUserAndArticle_IdIn(user, ids).stream()
                .map(b -> b.getArticle().getId())
                .collect(Collectors.toSet());
        Set<String> knownLemmas = findKnownLemmas(user, entries.stream()
                .flatMap(e -> e.annotationLemmas().stream())
                .distinct()
                .toList());

        List<ReadingArticleSummaryResponse> items = entries.stream()
                .map(e -> new ReadingArticleSummaryResponse(
                        e.id(),
                        e.title(),
                        e.categoryId(),
                        e.categoryTitle(),
                        e.level() != null ? e.level().getValue() : null,
                        e.imageUrl(),
                        e.thumbnailUrl(),
                        e.viewCount(),
                        e.createdAt(),
                        (int) e.annotationLemmas().stream().filter(l -> !knownLemmas.contains(l)).count(),
                        learnedIds.contains(e.id()),
                        bookmarkedIds.contains(e.id())))
                .toList();
        return new ReadingArticlePageResponse(items, safePage, safeSize, cached.totalElements(), cached.totalPages());
    }

    private ReadingArticlePageResponse findBookmarkedPage(User user, LearningLevel level, String normalizedSearch,
                                                            String categoryId, int safePage, int safeSize) {
        Page<ReadingArticleListProjection> rows = readingArticleRepository.findBookmarkedListPageForUser(
                level, normalizedSearch, categoryId, user.getId(), PageRequest.of(safePage, safeSize));
        if (rows.isEmpty()) {
            return new ReadingArticlePageResponse(List.of(), safePage, safeSize, rows.getTotalElements(), rows.getTotalPages());
        }

        List<String> ids = rows.map(ReadingArticleListProjection::getId).toList();
        Set<String> learnedIds = learningProgressRepository.findByUserAndReadingIdIn(user, ids).stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsLearned()))
                .map(p -> p.getReading().getId())
                .collect(Collectors.toSet());
        Map<String, List<String>> lemmasByArticleId = readingArticleRepository.findAnnotationLemmas(ids).stream()
                .filter(row -> row.getLemma() != null)
                .collect(Collectors.groupingBy(
                        com.deutschbridge.backend.repository.ReadingArticleLemmaProjection::getArticleId,
                        Collectors.mapping(com.deutschbridge.backend.repository.ReadingArticleLemmaProjection::getLemma, Collectors.toList())));
        Set<String> knownLemmas = findKnownLemmas(user, lemmasByArticleId.values().stream().flatMap(List::stream).distinct().toList());

        List<ReadingArticleSummaryResponse> items = rows.stream()
                .map(r -> {
                    List<String> lemmas = lemmasByArticleId.getOrDefault(r.getId(), List.of());
                    return new ReadingArticleSummaryResponse(
                            r.getId(),
                            r.getTitle(),
                            r.getCategoryId(),
                            r.getCategoryTitle(),
                            r.getLevel() != null ? r.getLevel().getValue() : null,
                            r.getImageUrl(),
                            r.getThumbnailUrl(),
                            r.getViewCount(),
                            r.getCreatedAt(),
                            (int) lemmas.stream().filter(l -> !knownLemmas.contains(l)).count(),
                            learnedIds.contains(r.getId()),
                            true);
                })
                .toList();
        return new ReadingArticlePageResponse(items, safePage, safeSize, rows.getTotalElements(), rows.getTotalPages());
    }

    public List<ReadingLevelSummaryResponse> getLevelSummary() {
        return readingProgressCacheService.getLevelSummary(requestContext.getUserId());
    }

    /** Full article content comes from the shared cache; views are counted separately via {@link #recordView}. */
    public ReadingArticleResponse findByIdWithLearningProgress(String id) throws DataNotFoundException {
        ReadingArticle article = contentCacheService.getReadingArticle(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        return mapWithCurrentUserProgress(List.of(article)).get(0);
    }

    /** Counted on every open, even when the client serves the article from its own cache. */
    @Transactional
    public ReadingViewCountResponse recordView(String id) throws DataNotFoundException {
        if (readingArticleRepository.incrementViewCount(id) == 0) {
            throw new DataNotFoundException(NOT_FOUND_MSG);
        }
        return new ReadingViewCountResponse(readingArticleRepository.findViewCountById(id).orElse(0L));
    }

    private List<ReadingArticleResponse> mapWithCurrentUserProgress(List<ReadingArticle> articles) {
        if (articles.isEmpty()) return List.of();

        User user = userService.findByEmail(requestContext.getUserEmail());
        List<LearningProgress> progresses = learningProgressRepository.findByUserAndReadingIn(user, articles);
        Map<String, LearningProgress> progressByArticleId = progresses.stream()
                .collect(Collectors.toMap(p -> p.getReading().getId(), p -> p, (first, second) -> first));

        Set<String> bookmarkedIds = readingArticleBookmarkRepository.findByUserAndArticle_IdIn(
                        user, articles.stream().map(ReadingArticle::getId).toList())
                .stream()
                .map(b -> b.getArticle().getId())
                .collect(Collectors.toSet());

        List<String> lemmas = articles.stream()
                .flatMap(a -> a.getAnnotations() != null ? a.getAnnotations().stream() : java.util.stream.Stream.empty())
                .map(Annotation::getLemma)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
        Set<String> knownLemmas = findKnownLemmas(user, lemmas);

        return articles.stream()
                .map(a -> ReadingArticleMapper.mapToResponse(a, progressByArticleId.get(a.getId()), knownLemmas,
                        bookmarkedIds.contains(a.getId()),
                        userArticleAttemptRepository.existsByUserAndArticleAndCompletedAtIsNotNull(user, a)))
                .toList();
    }

    /**
     * The previous/next article in the current level's list order (see ReadingArticleRepository.findListPage) -
     * a lightweight sibling lookup for the reading page's Previous/Next controls, not user-scoped.
     */
    public ReadingArticleNavigationResponse findNavigation(String id) throws DataNotFoundException {
        ReadingArticle article = contentCacheService.getReadingArticle(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        if (article.getLevel() == null) {
            return new ReadingArticleNavigationResponse(null, null);
        }

        Pageable oneRow = PageRequest.of(0, 1);
        ReadingArticleNeighborResponse previous = readingArticleRepository
                .findPreviousInLevel(article.getLevel(), article.getCreatedAt(), article.getId(), oneRow)
                .stream()
                .findFirst()
                .map(n -> new ReadingArticleNeighborResponse(n.getId(), n.getTitle()))
                .orElse(null);
        ReadingArticleNeighborResponse next = readingArticleRepository
                .findNextInLevel(article.getLevel(), article.getCreatedAt(), article.getId(), oneRow)
                .stream()
                .findFirst()
                .map(n -> new ReadingArticleNeighborResponse(n.getId(), n.getTitle()))
                .orElse(null);
        return new ReadingArticleNavigationResponse(previous, next);
    }

    /** Adds the current user's bookmark on this article (idempotent - re-bookmarking is a no-op). */
    public ReadingArticleResponse addBookmark(String id) throws DataNotFoundException {
        ReadingArticle article = contentCacheService.getReadingArticle(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        User user = userService.findByEmail(requestContext.getUserEmail());
        if (!readingArticleBookmarkRepository.existsByUserAndArticle(user, article)) {
            ReadingArticleBookmark bookmark = new ReadingArticleBookmark();
            bookmark.setUser(user);
            bookmark.setArticle(article);
            readingArticleBookmarkRepository.save(bookmark);
        }
        return mapWithCurrentUserProgress(List.of(article)).get(0);
    }

    public ReadingArticleResponse removeBookmark(String id) throws DataNotFoundException {
        ReadingArticle article = contentCacheService.getReadingArticle(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        User user = userService.findByEmail(requestContext.getUserEmail());
        readingArticleBookmarkRepository.deleteByUserAndArticle(user, article);
        return mapWithCurrentUserProgress(List.of(article)).get(0);
    }

    private Set<String> findKnownLemmas(User user, List<String> lemmas) {
        if (lemmas.isEmpty()) return Set.of();
        return userWordProgressRepository.findByUserAndLemmaIn(user, lemmas).stream()
                .filter(p -> p.getStatus() == com.deutschbridge.backend.model.enums.WordProgressStatus.KNOWN)
                .map(UserWordProgress::getLemma)
                .collect(Collectors.toSet());
    }

    /**
     * categoryId (the admin form's dropdown) wins when present; categoryTitle (bulk import's plain-text
     * convenience) is only used as a fallback, resolving to an existing category or creating one.
     * Both blank/absent means "no category" - null is a valid, intentional result.
     */
    private ReadingCategory resolveCategory(ReadingArticleManualRequest request) {
        if (request.categoryId() != null && !request.categoryId().isBlank()) {
            return readingCategoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found: " + request.categoryId()));
        }
        if (request.categoryTitle() != null && !request.categoryTitle().isBlank()) {
            return readingCategoryService.resolveOrCreateByTitle(request.categoryTitle());
        }
        return null;
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = "readingArticles", allEntries = true),
            @CacheEvict(cacheNames = "readingLevelSummary", allEntries = true)
    })
    public ReadingArticleResponse generate(String topic, LearningLevel level) {
        String raw = ollamaService.generateReadingArticle(topic, level);
        ParsedArticle parsed = parseGeneratedArticle(raw);

        ReadingArticle article = new ReadingArticle();
        article.setTitle(parsed.title());
        article.setLevel(level);
        article.setContent(parsed.text());
        article.setKeyVocabulary(parsed.vocabulary());
        article.setTokens(tokenizationService.tokenize(parsed.text()));

        ReadingArticle saved = readingArticleRepository.save(article);
        contentCacheService.evictReadingArticleListPagesForLevel(level);
        return ReadingArticleMapper.mapToResponse(saved, null, Set.of());
    }

    public List<KeyVocabularyItem> suggestVocabulary(String content, LearningLevel level) {
        String raw = ollamaService.extractKeyVocabulary(content, level);
        return parseVocabulary(raw);
    }

    public List<Annotation> suggestAnnotations(String content, LearningLevel level) {
        String raw = ollamaService.generateAnnotations(content, level);
        return parseAnnotations(raw, content);
    }

    public List<ReadingQuizQuestion> generateQuiz(String content, LearningLevel level, List<Annotation> annotations) {
        String raw = ollamaService.generateReadingQuiz(content, level);
        return parseQuiz(raw, annotations != null ? annotations : List.of());
    }

    /**
     * Admin-only: the quiz's correct answers/explanations are deliberately left out of the
     * student-facing reading response (see ReadingArticleMapper) so they can't be inspected
     * before an attempt, but the admin content-review UI needs the full questions to edit them.
     */
    public List<ReadingQuizQuestion> getQuizForAdmin(String id) throws DataNotFoundException {
        ReadingArticle article = findById(id);
        return article.getQuiz() != null ? article.getQuiz() : new ArrayList<>();
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = "readingArticles", allEntries = true),
            @CacheEvict(cacheNames = "readingLevelSummary", allEntries = true)
    })
    public ReadingArticleResponse createManual(ReadingArticleManualRequest request) {
        ReadingArticle article = new ReadingArticle();
        article.setTitle(request.title());
        article.setCategory(resolveCategory(request));
        article.setLevel(request.level());
        article.setContent(request.content());
        article.setImageUrl(request.imageUrl());
        article.setThumbnailUrl(request.thumbnailUrl());
        article.setKeyVocabulary(request.keyVocabulary() != null ? request.keyVocabulary() : new ArrayList<>());
        article.setAnnotations(prepareAnnotations(request.annotations(), article.getContent()));
        article.setQuiz(prepareQuiz(request.quiz()));
        article.setLinkedGroupId(request.linkedGroupId());
        article.setTokens(tokenizationService.tokenize(article.getContent()));

        ReadingArticle saved = readingArticleRepository.save(article);
        contentCacheService.evictReadingArticleListPagesForLevel(saved.getLevel());
        return ReadingArticleMapper.mapToResponse(saved, null, Set.of());
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = "readingArticles", allEntries = true),
            @CacheEvict(cacheNames = "readingLevelSummary", allEntries = true)
    })
    public ReadingArticleResponse update(String id, ReadingArticleManualRequest request) throws DataNotFoundException {
        ReadingArticle existing = findById(id);
        LearningLevel previousLevel = existing.getLevel();
        String previousImageUrl = existing.getImageUrl();
        String previousThumbnailUrl = existing.getThumbnailUrl();

        boolean contentChanged = request.content() != null && !request.content().equals(existing.getContent());

        if (request.title() != null) existing.setTitle(request.title());
        // Unlike the other fields below, category is always resolved (never skipped when absent) so
        // the edit form can also clear it - selecting "None" sends a blank categoryId/categoryTitle.
        existing.setCategory(resolveCategory(request));
        if (request.level() != null) existing.setLevel(request.level());
        if (request.content() != null) existing.setContent(request.content());
        if (request.imageUrl() != null) existing.setImageUrl(request.imageUrl());
        if (request.thumbnailUrl() != null) existing.setThumbnailUrl(request.thumbnailUrl());
        if (request.keyVocabulary() != null) existing.setKeyVocabulary(request.keyVocabulary());
        if (request.annotations() != null) existing.setAnnotations(prepareAnnotations(request.annotations(), existing.getContent()));
        if (request.quiz() != null) existing.setQuiz(prepareQuiz(request.quiz()));
        if (request.linkedGroupId() != null) existing.setLinkedGroupId(request.linkedGroupId());
        if (contentChanged || existing.getTokens() == null) {
            existing.setTokens(tokenizationService.tokenize(existing.getContent()));
        }

        ReadingArticle saved = readingArticleRepository.save(existing);
        contentCacheService.evictReadingArticleDetail(id);
        contentCacheService.evictReadingArticleListPagesForLevel(previousLevel);
        if (saved.getLevel() != previousLevel) {
            contentCacheService.evictReadingArticleListPagesForLevel(saved.getLevel());
        }

        // Only once the new value is actually persisted, and only when the request touched imageUrl/
        // thumbnailUrl at all (a partial update that doesn't touch either must not wipe the existing
        // files).
        if (request.imageUrl() != null && !request.imageUrl().equals(previousImageUrl)) {
            fileStorageService.deleteFile(previousImageUrl);
        }
        if (request.thumbnailUrl() != null && !request.thumbnailUrl().equals(previousThumbnailUrl)) {
            fileStorageService.deleteFile(previousThumbnailUrl);
        }

        return ReadingArticleMapper.mapToResponse(saved, null, Set.of());
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = "readingArticles", allEntries = true),
            @CacheEvict(cacheNames = "readingLevelSummary", allEntries = true)
    })
    public void delete(String id) throws DataNotFoundException {
        ReadingArticle existing = findById(id);
        fileStorageService.deleteFile(existing.getImageUrl());
        fileStorageService.deleteFile(existing.getThumbnailUrl());
        userArticleAttemptRepository.deleteByArticle(existing);
        learningProgressRepository.deleteByReading(existing);
        readingArticleBookmarkRepository.deleteByArticle(existing);
        readingArticleRepository.deleteById(id);
        contentCacheService.evictReadingArticleDetail(id);
        contentCacheService.evictReadingArticleListPagesForLevel(existing.getLevel());
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = "readingArticles", allEntries = true),
            @CacheEvict(cacheNames = "readingLevelSummary", allEntries = true)
    })
    public void deleteAll(List<String> ids) {
        for (String id : ids) {
            ReadingArticle existing = readingArticleRepository.findById(id).orElse(null);
            if (existing == null) continue;
            fileStorageService.deleteFile(existing.getImageUrl());
            fileStorageService.deleteFile(existing.getThumbnailUrl());
            userArticleAttemptRepository.deleteByArticle(existing);
            learningProgressRepository.deleteByReading(existing);
            readingArticleBookmarkRepository.deleteByArticle(existing);
            readingArticleRepository.deleteById(id);
            contentCacheService.evictReadingArticleDetail(id);
            contentCacheService.evictReadingArticleListPagesForLevel(existing.getLevel());
        }
    }

    /** Best-effort bulk import: each row is validated and saved independently.
     * createManual's own scoped eviction doesn't fire here (this is an internal self-invocation,
     * bypassing the Spring AOP proxy), so every affected level is evicted once at the end instead. */
    @Caching(evict = {
            @CacheEvict(cacheNames = "readingArticles", allEntries = true),
            @CacheEvict(cacheNames = "readingLevelSummary", allEntries = true)
    })
    public ReadingArticleBulkImportResult bulkImport(List<JsonNode> rows) {
        List<ReadingArticleBulkImportRowResult> results = new ArrayList<>();
        Set<LearningLevel> affectedLevels = new HashSet<>();
        int successCount = 0;

        for (int i = 0; i < rows.size(); i++) {
            JsonNode row = rows.get(i);
            String title = row.hasNonNull("title") ? row.get("title").asText() : null;
            try {
                ReadingArticleManualRequest request = objectMapper.treeToValue(row, ReadingArticleManualRequest.class);
                validateRequiredFields(request);
                ReadingArticleResponse saved = createManual(request);
                affectedLevels.add(request.level());
                results.add(new ReadingArticleBulkImportRowResult(i, title, true, null, saved.id()));
                successCount++;
            } catch (Exception e) {
                results.add(new ReadingArticleBulkImportRowResult(i, title, false, describeImportError(e), null));
            }
        }
        affectedLevels.forEach(contentCacheService::evictReadingArticleListPagesForLevel);

        return new ReadingArticleBulkImportResult(rows.size(), successCount, rows.size() - successCount, results);
    }

    private void validateRequiredFields(ReadingArticleManualRequest request) {
        if (request.title() == null || request.title().isBlank()) {
            throw new IllegalArgumentException("\"title\" is required.");
        }
        if (request.level() == null) {
            throw new IllegalArgumentException("\"level\" is required (A1, A2, B1, B2, C1, or C2).");
        }
        if (request.content() == null || request.content().isBlank()) {
            throw new IllegalArgumentException("\"content\" is required.");
        }
    }

    private String describeImportError(Exception e) {
        if (e instanceof InvalidFormatException invalidFormat) {
            String field = describeFieldPath(invalidFormat.getPath());
            return "Invalid value \"" + invalidFormat.getValue() + "\" for \"" + field + "\".";
        }
        if (e instanceof IllegalArgumentException) {
            return e.getMessage();
        }
        return "Could not import this row: " + e.getMessage();
    }

    /** Full dotted/indexed path (e.g. "annotations[1].type") instead of just the outermost field. */
    private static String describeFieldPath(List<JsonMappingException.Reference> path) {
        StringBuilder sb = new StringBuilder();
        for (JsonMappingException.Reference ref : path) {
            if (ref.getFieldName() != null) {
                if (!sb.isEmpty()) sb.append('.');
                sb.append(ref.getFieldName());
            } else if (ref.getIndex() >= 0) {
                sb.append('[').append(ref.getIndex()).append(']');
            }
        }
        return !sb.isEmpty() ? sb.toString() : "a field";
    }

    private List<Annotation> prepareAnnotations(List<Annotation> annotations, String content) {
        if (annotations == null) return new ArrayList<>();
        for (Annotation annotation : annotations) {
            annotation.ensureId();
            if ((annotation.getSpans() == null || annotation.getSpans().isEmpty())
                    && content != null && annotation.getSurfaceText() != null && !annotation.getSurfaceText().isBlank()) {
                annotation.setSpans(locateSpans(content, annotation.getSurfaceText()));
            }
        }
        return annotations;
    }

    private List<ReadingQuizQuestion> prepareQuiz(List<ReadingQuizQuestion> quiz) {
        if (quiz == null) return new ArrayList<>();
        quiz.forEach(ReadingQuizQuestion::ensureId);
        return quiz;
    }

    private ParsedArticle parseGeneratedArticle(String raw) {
        int titleIdx = raw.indexOf(TITLE_MARKER);
        int textIdx = raw.indexOf(TEXT_MARKER);
        int vocabIdx = raw.indexOf(VOCAB_MARKER);

        String title = titleIdx >= 0 && textIdx > titleIdx
                ? raw.substring(titleIdx + TITLE_MARKER.length(), textIdx).trim()
                : "";
        String text = textIdx >= 0
                ? raw.substring(textIdx + TEXT_MARKER.length(), vocabIdx >= 0 ? vocabIdx : raw.length()).trim()
                : raw.trim();
        List<KeyVocabularyItem> vocabulary = vocabIdx >= 0
                ? parseVocabulary(raw.substring(vocabIdx))
                : List.of();

        return new ParsedArticle(title, text, vocabulary);
    }

    private List<KeyVocabularyItem> parseVocabulary(String vocabSection) {
        int vocabIdx = vocabSection.indexOf(VOCAB_MARKER);
        String lines = vocabIdx >= 0 ? vocabSection.substring(vocabIdx + VOCAB_MARKER.length()) : vocabSection;

        List<KeyVocabularyItem> items = new ArrayList<>();
        for (String line : lines.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty() || !trimmed.startsWith("-")) continue;

            String withoutBullet = trimmed.substring(1).trim();
            int colonIdx = withoutBullet.indexOf(':');
            if (colonIdx < 0) continue;

            String word = withoutBullet.substring(0, colonIdx).trim();
            String meaning = withoutBullet.substring(colonIdx + 1).trim();
            if (!word.isEmpty() && !meaning.isEmpty()) {
                items.add(new KeyVocabularyItem(word, meaning));
            }
        }
        return items;
    }

    List<Annotation> parseAnnotations(String raw, String content) {
        int idx = raw.indexOf(ANNOTATIONS_MARKER);
        String lines = idx >= 0 ? raw.substring(idx + ANNOTATIONS_MARKER.length()) : raw;

        List<Annotation> result = new ArrayList<>();
        for (String line : lines.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            String[] parts = trimmed.split("\\|");
            if (parts.length < 3) continue;

            AnnotationType type = switch (parts[0].trim().toUpperCase()) {
                case "WORD" -> AnnotationType.WORD;
                case "NVV" -> AnnotationType.NOMEN_VERB_VERBINDUNG;
                case "REDEWENDUNG" -> AnnotationType.REDEWENDUNG;
                default -> null;
            };
            if (type == null) continue;

            Annotation annotation = new Annotation();
            annotation.setType(type);
            annotation.setSurfaceText(field(parts, 1));
            annotation.setLemma(field(parts, 2) != null ? field(parts, 2) : field(parts, 1));

            switch (type) {
                case WORD -> {
                    annotation.setPos(field(parts, 3));
                    annotation.setGender(field(parts, 4));
                    annotation.setPluralForm(field(parts, 5));
                    annotation.setTranslationEn(field(parts, 6));
                    annotation.setCefrLevel(parseLevel(field(parts, 7)));
                    annotation.setExampleSentence(field(parts, 8));
                }
                case NOMEN_VERB_VERBINDUNG -> {
                    annotation.setTranslationEn(field(parts, 6));
                    annotation.setCefrLevel(parseLevel(field(parts, 7)));
                    annotation.setExampleSentence(field(parts, 8));
                }
                case REDEWENDUNG -> {
                    annotation.setTranslationEn(field(parts, 6));
                    annotation.setLiteralTranslation(field(parts, 7));
                    annotation.setCefrLevel(parseLevel(field(parts, 8)));
                    annotation.setExampleSentence(field(parts, 9));
                }
            }

            if (annotation.getSurfaceText() == null || annotation.getSurfaceText().isBlank()) continue;

            annotation.setSpans(locateSpans(content, annotation.getSurfaceText()));
            annotation.ensureId();
            result.add(annotation);
        }
        return result;
    }

    List<ReadingQuizQuestion> parseQuiz(String raw, List<Annotation> annotations) {
        int idx = raw.indexOf(QUIZ_MARKER);
        String lines = idx >= 0 ? raw.substring(idx + QUIZ_MARKER.length()) : raw;

        List<ReadingQuizQuestion> result = new ArrayList<>();
        for (String line : lines.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            String[] parts = trimmed.split("\\|");
            if (parts.length < 6) continue;

            ReadingQuizQuestionType type;
            try {
                type = ReadingQuizQuestionType.valueOf(parts[0].trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                continue;
            }

            String optionsRaw = field(parts, 2);
            List<String> options = optionsRaw == null
                    ? List.of()
                    : Arrays.stream(optionsRaw.split(";")).map(String::trim).filter(s -> !s.isEmpty()).toList();

            ReadingQuizQuestion question = new ReadingQuizQuestion();
            question.setType(type);
            question.setPrompt(field(parts, 1));
            question.setOptions(options);
            question.setCorrectAnswer(field(parts, 3));
            question.setExplanation(field(parts, 4));
            question.setSupportingSentence(field(parts, 5));
            question.setMinLevel(type == ReadingQuizQuestionType.INFERENCE ? LearningLevel.B1 : LearningLevel.A1);

            if (type == ReadingQuizQuestionType.VOCAB_CONTEXT) {
                String relatedLemma = field(parts, 6);
                if (relatedLemma != null) {
                    annotations.stream()
                            .filter(a -> relatedLemma.equalsIgnoreCase(a.getLemma()))
                            .findFirst()
                            .ifPresent(a -> question.setRelatedAnnotationId(a.getId()));
                }
            }

            if (question.getPrompt() == null || question.getPrompt().isBlank()) continue;

            question.ensureId();
            result.add(question);
        }
        return result;
    }

    private List<Span> locateSpans(String content, String surfaceText) {
        int idx = indexOfIgnoreCase(content, surfaceText, 0);
        if (idx >= 0) {
            return new ArrayList<>(List.of(new Span(idx, idx + surfaceText.length())));
        }

        List<Span> spans = new ArrayList<>();
        int searchFrom = 0;
        for (String token : surfaceText.split("\\s+")) {
            if (token.isBlank()) continue;
            int tokenIdx = indexOfIgnoreCase(content, token, searchFrom);
            if (tokenIdx < 0) continue;
            spans.add(new Span(tokenIdx, tokenIdx + token.length()));
            searchFrom = tokenIdx + token.length();
        }
        return spans;
    }

    private int indexOfIgnoreCase(String haystack, String needle, int from) {
        return haystack.toLowerCase().indexOf(needle.toLowerCase(), Math.max(from, 0));
    }

    private String field(String[] parts, int i) {
        if (i >= parts.length) return null;
        String value = parts[i].trim();
        return value.isEmpty() || value.equals("-") ? null : value;
    }

    private LearningLevel parseLevel(String value) {
        if (value == null) return null;
        try {
            return LearningLevel.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private record ParsedArticle(String title, String text, List<KeyVocabularyItem> vocabulary) {
    }
}
