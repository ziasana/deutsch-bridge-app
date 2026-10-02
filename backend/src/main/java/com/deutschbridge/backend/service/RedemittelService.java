package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.RedemittelDto;
import com.deutschbridge.backend.model.dto.RedemittelHubResponse;
import com.deutschbridge.backend.model.dto.RedemittelPageResponse;
import com.deutschbridge.backend.model.entity.RedemittelCollectionItem;
import com.deutschbridge.backend.model.entity.RedemittelProgress;
import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.*;
import com.deutschbridge.backend.repository.RedemittelCollectionRepository;
import com.deutschbridge.backend.repository.RedemittelProgressRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.deutschbridge.backend.service.cache.RedemittelCacheService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Learner side of the Redemittel module. The Redemittel themselves are the shared WritingPhrase
 * records (also used by Schreiben and managed in the admin); this service only adds the caller's
 * own progress and collection on top. Everything user-specific is keyed by the authenticated user.
 */
@Service
public class RedemittelService {

    public static final String DAILY_NEW_KEY = "redemittel.daily.new";
    public static final int DEFAULT_DAILY_NEW = 3;
    static final int MAX_PAGE_SIZE = 50;

    private final WritingPhraseRepository phraseRepository;
    private final RedemittelProgressRepository progressRepository;
    private final RedemittelCollectionRepository collectionRepository;
    private final AppSettingService appSettingService;
    private final UserService userService;
    private final LearningActivityService learningActivityService;
    private final RequestContext requestContext;
    private final RedemittelCacheService cacheService;

    public RedemittelService(WritingPhraseRepository phraseRepository,
                             RedemittelProgressRepository progressRepository,
                             RedemittelCollectionRepository collectionRepository,
                             AppSettingService appSettingService,
                             UserService userService,
                             LearningActivityService learningActivityService,
                             RequestContext requestContext,
                             RedemittelCacheService cacheService) {
        this.phraseRepository = phraseRepository;
        this.progressRepository = progressRepository;
        this.collectionRepository = collectionRepository;
        this.appSettingService = appSettingService;
        this.userService = userService;
        this.learningActivityService = learningActivityService;
        this.requestContext = requestContext;
        this.cacheService = cacheService;
    }

    // ---- browse ----

    /** One page of Redemittel with the caller's progress; every filter is optional. */
    public RedemittelPageResponse list(LearningLevel level, String category, String search,
                                       RedemittelStatus status, boolean savedOnly, int page, int size) {
        String userId = requestContext.getUserId();
        int pageSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        String term = search == null ? "" : search.strip().toLowerCase(Locale.ROOT);

        // Without a per-user filter the page is shared content: served from the cache, progress merged live.
        if (status == null && !savedOnly) {
            RedemittelCacheService.PhrasePage cached = cacheService.getListPage(level, category, term, Math.max(0, page), pageSize);
            return new RedemittelPageResponse(toDtos(userId, cached.items()), cached.page(), cached.size(), cached.totalElements(), cached.totalPages());
        }

        Page<WritingPhrase> result = phraseRepository.findLearnerPage(
                userId,
                level == null ? List.of(LearningLevel.values()) : List.of(level),
                category == null,
                category == null ? "" : category,
                "%" + term + "%",
                status == null || status == RedemittelStatus.NEW,
                status == null ? List.of(RedemittelStatus.values()) : List.of(status),
                savedOnly,
                PageRequest.of(Math.max(0, page), pageSize));

        List<RedemittelDto> items = toDtos(userId, result.getContent());
        return new RedemittelPageResponse(items, result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    public RedemittelDto get(String id) throws DataNotFoundException {
        WritingPhrase phrase = findActive(id);
        return toDtos(requestContext.getUserId(), List.of(phrase)).get(0);
    }

    // ---- hub ----

    public RedemittelHubResponse hub() {
        String userId = requestContext.getUserId();
        LocalDateTime now = LocalDateTime.now();

        RedemittelCacheService.HubContent content = cacheService.getHubContent();
        long active = content.activeCount();
        long started = progressRepository.countByUserId(userId);
        long mastered = progressRepository.countByUserIdAndStatus(userId, RedemittelStatus.MASTERED);
        long review = progressRepository.countByUserIdAndStatus(userId, RedemittelStatus.REVIEW);
        long learning = progressRepository.countByUserIdAndStatus(userId, RedemittelStatus.LEARNING);
        long fresh = Math.max(0, active - started);

        int target = dailyTarget();
        int learnedToday = (int) progressRepository.countByUserIdAndLearnedAtAfter(userId, LocalDate.now().atStartOfDay());
        int newToday = (int) Math.min(Math.max(0, target - learnedToday), fresh);

        List<RedemittelHubResponse.Category> categories = content.categories();

        return new RedemittelHubResponse(
                (int) progressRepository.countDue(userId, now),
                newToday,
                target,
                learnedToday,
                collectionRepository.countByUserId(userId),
                new RedemittelHubResponse.Summary(started, mastered, review, learning, fresh),
                categories);
    }

    // ---- today ----

    /**
     * The Redemittel still to learn today: the daily target minus what was already learned today.
     * Saved expressions come first, then the learner's level (nearest levels next), and the order is
     * stable so a reload shows the same ones until they are learned.
     */
    public List<RedemittelDto> today() {
        String userId = requestContext.getUserId();
        int remaining = dailyTarget() - (int) progressRepository.countByUserIdAndLearnedAtAfter(userId, LocalDate.now().atStartOfDay());
        if (remaining <= 0) return List.of();

        Set<String> savedIds = collectionRepository.findByUserId(userId).stream()
                .map(RedemittelCollectionItem::getPhraseId).collect(Collectors.toSet());
        int userLevel = userLevelOrdinal();

        List<WritingPhrase> picked = phraseRepository.findUnlearned(userId).stream()
                .sorted(Comparator
                        .comparing((WritingPhrase p) -> !savedIds.contains(p.getId()))
                        .thenComparingInt(p -> Math.abs(p.getLevel().ordinal() - userLevel))
                        .thenComparing(WritingPhrase::getLevel)
                        .thenComparingInt(WritingPhrase::getSortOrder)
                        .thenComparing(WritingPhrase::getId))
                .limit(remaining)
                .toList();
        return toDtos(userId, picked);
    }

    // ---- learn / save ----

    /** Marks an expression as learned: it starts its review schedule. Idempotent. */
    @Transactional
    public RedemittelDto learn(String id) throws DataNotFoundException {
        WritingPhrase phrase = findActive(id);
        String userId = requestContext.getUserId();
        if (progressRepository.findByUserIdAndPhraseId(userId, id).isEmpty()) {
            RedemittelProgress progress = new RedemittelProgress();
            progress.setUserId(userId);
            progress.setPhraseId(id);
            RedemittelScheduler.start(progress, LocalDateTime.now());
            progressRepository.save(progress);
            learningActivityService.track(userId, LearningModule.REDEMITTEL, LearningActivityType.REDEMITTEL_LEARNED, id);
        }
        return toDtos(userId, List.of(phrase)).get(0);
    }

    @Transactional
    public RedemittelDto save(String id) throws DataNotFoundException {
        WritingPhrase phrase = findActive(id);
        String userId = requestContext.getUserId();
        if (collectionRepository.findByUserIdAndPhraseId(userId, id).isEmpty()) {
            RedemittelCollectionItem item = new RedemittelCollectionItem();
            item.setUserId(userId);
            item.setPhraseId(id);
            collectionRepository.save(item);
        }
        return toDtos(userId, List.of(phrase)).get(0);
    }

    @Transactional
    public RedemittelDto unsave(String id) throws DataNotFoundException {
        WritingPhrase phrase = findActive(id);
        String userId = requestContext.getUserId();
        collectionRepository.deleteByUserIdAndPhraseId(userId, id);
        return toDtos(userId, List.of(phrase)).get(0);
    }

    // ---- shared helpers ----

    int dailyTarget() {
        return Math.max(1, appSettingService.getInt(DAILY_NEW_KEY, DEFAULT_DAILY_NEW));
    }

    WritingPhrase findActive(String id) throws DataNotFoundException {
        return cacheService.getActivePhrase(id)
                .orElseThrow(() -> new DataNotFoundException("Redemittel not found!"));
    }

    List<RedemittelDto> toDtos(String userId, List<WritingPhrase> phrases) {
        if (phrases.isEmpty()) return List.of();
        List<String> ids = phrases.stream().map(WritingPhrase::getId).toList();
        Map<String, RedemittelProgress> progress = progressRepository.findByUserIdAndPhraseIdIn(userId, ids).stream()
                .collect(Collectors.toMap(RedemittelProgress::getPhraseId, Function.identity()));
        Set<String> saved = collectionRepository.findByUserIdAndPhraseIdIn(userId, ids).stream()
                .map(RedemittelCollectionItem::getPhraseId).collect(Collectors.toSet());
        String language = requestContext.getLanguage();
        return phrases.stream().map(p -> toDto(p, progress.get(p.getId()), saved.contains(p.getId()), language)).toList();
    }

    static RedemittelDto toDto(WritingPhrase p, RedemittelProgress progress, boolean saved, String language) {
        return new RedemittelDto(p.getId(), p.getLevel(), p.getCategory().getId(), p.getCategory().getLabel(), p.getPhrase(),
                meaningOf(p, language), p.getExplanation(), p.getExample(), p.getFormality(), p.getUsageNote(),
                p.getGrammarPattern(), p.getCommonMistake(),
                RedemittelText.splitLines(p.getSimilarExpressions()), RedemittelText.splitContexts(p.getContexts()),
                progress == null ? RedemittelStatus.NEW : progress.getStatus(),
                progress == null ? null : progress.getNextReviewAt(),
                saved);
    }

    /** The gloss in the learner's language, falling back to the German explanation (or null if none is authored). */
    static String meaningOf(WritingPhrase p, String language) {
        String lang = language == null ? "EN" : language.toUpperCase(Locale.ROOT);
        String localized = switch (lang) {
            case "FA" -> firstNonBlank(p.getMeaningFa(), p.getMeaningEn());
            case "DE" -> null;
            default -> p.getMeaningEn();
        };
        return firstNonBlank(localized, p.getExplanation());
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        return b != null && !b.isBlank() ? b : null;
    }

    private int userLevelOrdinal() {
        String value = userService.getLearningLevel(requestContext.getUserEmail());
        return Arrays.stream(LearningLevel.values())
                .filter(l -> l.getValue().equals(value))
                .findFirst().orElse(LearningLevel.A1).ordinal();
    }
}
