package com.deutschbridge.backend.service.cache;

import com.deutschbridge.backend.model.entity.Expression;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.GrammarCategory;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.ReadingArticle;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import com.deutschbridge.backend.model.enums.ExpressionType;
import com.deutschbridge.backend.model.enums.GrammarLessonStatus;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import com.deutschbridge.backend.repository.ExpressionRepository;
import com.deutschbridge.backend.repository.GrammarCategoryRepository;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import com.deutschbridge.backend.repository.ReadingArticleLemmaProjection;
import com.deutschbridge.backend.repository.ReadingArticleListProjection;
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import jakarta.transaction.Transactional;
import org.hibernate.Hibernate;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Caches only the expensive, shared "static content" fetches (published lessons/exercises/
 * expressions/articles) that content services merge the current user's live per-user progress
 * into afterwards. The per-user merge itself is never cached here - it must stay live.
 *
 * Every method here is transactional (jakarta.transaction.Transactional, matching this codebase's
 * convention - it has no readOnly attribute, unlike Spring's own annotation) and force-initializes
 * any lazy association it hands back with Hibernate.initialize(...) before returning, because
 * Caffeine caches the actual
 * Java objects (no serialization) - an association that was still an uninitialized proxy/collection
 * when the transaction closed would throw LazyInitializationException on later access.
 *
 * Cache entries are evicted immediately (see @CacheEvict on the admin write methods in the
 * respective services) whenever the underlying content changes - the TTL configured in
 * CacheConfig is a safety net only, not the primary invalidation mechanism.
 */
@Service
public class ContentCacheService {

    private static final Comparator<GrammarLesson> LESSON_ORDER = Comparator
            .comparing((GrammarLesson l) -> l.getSortOrder() != null ? l.getSortOrder() : 0)
            .thenComparing(GrammarLesson::getTitle, Comparator.nullsLast(Comparator.naturalOrder()));

    private final GrammarLessonRepository grammarLessonRepository;
    private final GrammarCategoryRepository grammarCategoryRepository;
    private final ExamExerciseRepository examExerciseRepository;
    private final ExpressionRepository expressionRepository;
    private final ReadingArticleRepository readingArticleRepository;

    public ContentCacheService(GrammarLessonRepository grammarLessonRepository,
                                GrammarCategoryRepository grammarCategoryRepository,
                                ExamExerciseRepository examExerciseRepository,
                                ExpressionRepository expressionRepository,
                                ReadingArticleRepository readingArticleRepository) {
        this.grammarLessonRepository = grammarLessonRepository;
        this.grammarCategoryRepository = grammarCategoryRepository;
        this.examExerciseRepository = examExerciseRepository;
        this.expressionRepository = expressionRepository;
        this.readingArticleRepository = readingArticleRepository;
    }

    @Cacheable("grammarLessons")
    @Transactional
    public List<GrammarLesson> getPublishedGrammarLessons() {
        List<GrammarLesson> published = grammarLessonRepository.getWithLearningProgress().stream()
                .filter(l -> l.getStatus() != GrammarLessonStatus.DRAFT)
                .toList();
        published.forEach(lesson -> {
            Hibernate.initialize(lesson.getCategory());
            Hibernate.initialize(lesson.getQuiz());
        });
        return published;
    }

    /**
     * The learner list for one level: that level's categories (every one, even without published
     * lessons yet) with their published lessons, plus the level's uncategorized published lessons -
     * reduced to light list rows so no lesson content or quiz is kept in this cache.
     */
    @Cacheable("grammarLevelContent")
    @Transactional
    public GrammarLevelContent getGrammarLevelContent(LearningLevel level) {
        List<GrammarLesson> lessons = grammarLessonRepository.findForLevelView(level, GrammarLessonStatus.PUBLISHED);
        Map<String, List<GrammarLessonEntry>> lessonsByCategoryId = lessons.stream()
                .filter(l -> l.getCategory() != null)
                .sorted(LESSON_ORDER)
                .collect(Collectors.groupingBy(l -> l.getCategory().getId(), Collectors.mapping(GrammarLessonEntry::of, Collectors.toList())));

        List<GrammarCategoryEntry> categories = grammarCategoryRepository.findByLevelOrderBySortOrderAscTitleAsc(level).stream()
                .map(c -> new GrammarCategoryEntry(c.getId(), c.getTitle(), c.getTitleFa(), c.getLevel(), c.getSortOrder(),
                        c.getPassThreshold(), lessonsByCategoryId.getOrDefault(c.getId(), List.of())))
                .toList();
        List<GrammarLessonEntry> uncategorized = lessons.stream()
                .filter(l -> l.getCategory() == null)
                .sorted(LESSON_ORDER)
                .map(GrammarLessonEntry::of)
                .toList();
        return new GrammarLevelContent(categories, uncategorized);
    }

    /** A single published lesson's full content (DRAFT lessons are never returned to learners). */
    @Cacheable(cacheNames = "grammarLessonDetail", unless = "#result == null")
    @Transactional
    public Optional<GrammarLesson> getPublishedGrammarLesson(String id) {
        Optional<GrammarLesson> lesson = grammarLessonRepository.findByIdAndStatus(id, GrammarLessonStatus.PUBLISHED);
        lesson.ifPresent(l -> {
            Hibernate.initialize(l.getCategory());
            Hibernate.initialize(l.getQuiz());
        });
        return lesson;
    }

    /** One category with its published lessons (full, quizzes included) - for the category test. */
    @Cacheable(cacheNames = "grammarCategoryDetail", unless = "#result == null")
    @Transactional
    public Optional<CategoryWithPublishedLessons> getGrammarCategoryWithPublishedLessons(String id) {
        return grammarCategoryRepository.findById(id).map(category -> {
            List<GrammarLesson> publishedLessons = grammarLessonRepository
                    .findByCategoryAndStatus(category, GrammarLessonStatus.PUBLISHED).stream()
                    .sorted(LESSON_ORDER)
                    .toList();
            publishedLessons.forEach(lesson -> {
                Hibernate.initialize(lesson.getCategory());
                Hibernate.initialize(lesson.getQuiz());
            });
            return new CategoryWithPublishedLessons(category, publishedLessons);
        });
    }

    @Cacheable("examExercises")
    @Transactional
    public List<ExamExercise> getPublishedExamExercises(ExamSection section, LearningLevel level, ExamTaskType taskType) {
        List<ExamExercise> exercises = examExerciseRepository.findFiltered(section, level, taskType);

        List<ExamExercise> published = exercises.stream().filter(ExamExercise::isPublished).toList();
        published.forEach(exercise -> {
            Hibernate.initialize(exercise.getPassages());
            Hibernate.initialize(exercise.getQuestions());
            Hibernate.initialize(exercise.getAnswerOptions());
        });
        return published;
    }

    @Cacheable("expressions")
    @Transactional
    public List<Expression> getPublishedExpressions(ExpressionType type) {
        List<Expression> expressions = expressionRepository.findAll().stream()
                .filter(e -> e.getStatus() != ExpressionStatus.DRAFT)
                .filter(e -> type == null || e.getType() == type)
                .toList();
        expressions.forEach(expression -> {
            Hibernate.initialize(expression.getExamples());
            Hibernate.initialize(expression.getPatterns());
            Hibernate.initialize(expression.getQuestions());
        });
        return expressions;
    }

    /**
     * Admin-only full list (the student list uses the paged {@link #getReadingArticleListPage} instead).
     *
     * NOTE: ReadingArticle.viewCount is incremented on every article open (ReadingArticleService.recordView)
     * and is exposed in the responses built from these cached entries, so the viewCount on anything
     * served from the reading caches can go stale between cache refreshes/evictions. This is an
     * accepted, intentional tradeoff - view count is a cosmetic counter, not worth invalidating the
     * caches on every single article view.
     */
    @Cacheable("readingArticles")
    @Transactional
    public List<ReadingArticle> getAllReadingArticles() {
        List<ReadingArticle> articles = readingArticleRepository.findAll();
        initializeReadingArticles(articles);
        return articles;
    }

    /**
     * One page of a level's list columns plus each article's annotation lemmas (so the service can
     * compute the per-user new-word count without the annotations themselves). search must already be
     * trimmed and lower-cased so equivalent searches share a cache entry. See the viewCount note on
     * {@link #getAllReadingArticles()}.
     */
    @Cacheable("readingArticleList")
    @Transactional
    public ReadingArticleListPage getReadingArticleListPage(LearningLevel level, String search, int page, int size) {
        Page<ReadingArticleListProjection> rows = readingArticleRepository.findListPage(level, search, PageRequest.of(page, size));

        Map<String, List<String>> lemmasByArticleId = rows.isEmpty()
                ? Map.of()
                : readingArticleRepository.findAnnotationLemmas(rows.map(ReadingArticleListProjection::getId).toList())
                .stream()
                .filter(row -> row.getLemma() != null)
                .collect(Collectors.groupingBy(ReadingArticleLemmaProjection::getArticleId,
                        Collectors.mapping(ReadingArticleLemmaProjection::getLemma, Collectors.toList())));

        List<ReadingArticleListEntry> entries = rows.stream()
                .map(row -> new ReadingArticleListEntry(
                        row.getId(),
                        row.getTitle(),
                        row.getTopic(),
                        row.getLevel(),
                        row.getImageUrl(),
                        row.getViewCount(),
                        row.getCreatedAt(),
                        lemmasByArticleId.getOrDefault(row.getId(), List.of())))
                .toList();
        return new ReadingArticleListPage(entries, rows.getTotalElements(), rows.getTotalPages());
    }

    /** A single article's full content (quiz included - the mapper strips it for students). See the viewCount note above. */
    @Cacheable(cacheNames = "readingArticleDetail", unless = "#result == null")
    @Transactional
    public Optional<ReadingArticle> getReadingArticle(String id) {
        Optional<ReadingArticle> article = readingArticleRepository.findById(id);
        article.ifPresent(a -> initializeReadingArticles(List.of(a)));
        return article;
    }

    private void initializeReadingArticles(List<ReadingArticle> articles) {
        articles.forEach(article -> {
            Hibernate.initialize(article.getKeyVocabulary());
            Hibernate.initialize(article.getAnnotations());
            Hibernate.initialize(article.getQuiz());
            Hibernate.initialize(article.getTokens());
        });
    }

    public record ReadingArticleListEntry(String id, String title, String topic, LearningLevel level, String imageUrl,
                                          long viewCount, LocalDateTime createdAt, List<String> annotationLemmas) {
    }

    public record ReadingArticleListPage(List<ReadingArticleListEntry> entries, long totalElements, int totalPages) {
    }

    public record GrammarLessonEntry(String id, String title, String titleFa, String summary, String summaryFa,
                                     LearningLevel level, int quizCount) {
        static GrammarLessonEntry of(GrammarLesson lesson) {
            return new GrammarLessonEntry(lesson.getId(), lesson.getTitle(), lesson.getTitleFa(), lesson.getSummary(),
                    lesson.getSummaryFa(), lesson.getLevel(), lesson.getQuiz() != null ? lesson.getQuiz().size() : 0);
        }
    }

    public record GrammarCategoryEntry(String id, String title, String titleFa, LearningLevel level, int sortOrder,
                                       int passThreshold, List<GrammarLessonEntry> lessons) {
    }

    public record GrammarLevelContent(List<GrammarCategoryEntry> categories, List<GrammarLessonEntry> uncategorized) {
    }

    public record CategoryWithPublishedLessons(GrammarCategory category, List<GrammarLesson> publishedLessons) {
    }
}
