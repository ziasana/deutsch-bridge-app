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
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import jakarta.transaction.Transactional;
import org.hibernate.Hibernate;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

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
     * Static shape needed by GrammarCategoryService.findAllForLearner(): every category
     * (ordered as the learner screen expects) paired with its published lessons only, sorted the
     * same way the current (uncached) implementation sorts them.
     */
    @Cacheable("grammarCategories")
    @Transactional
    public List<CategoryWithPublishedLessons> getGrammarCategoriesWithPublishedLessons() {
        List<GrammarCategory> categories = grammarCategoryRepository.findAllByOrderByLevelAscSortOrderAsc();
        return categories.stream()
                .map(category -> {
                    List<GrammarLesson> publishedLessons = grammarLessonRepository.findByCategory(category).stream()
                            .filter(l -> l.getStatus() == GrammarLessonStatus.PUBLISHED)
                            .sorted(Comparator
                                    .comparing((GrammarLesson l) -> l.getSortOrder() != null ? l.getSortOrder() : 0)
                                    .thenComparing(GrammarLesson::getTitle))
                            .toList();
                    publishedLessons.forEach(lesson -> {
                        Hibernate.initialize(lesson.getCategory());
                        Hibernate.initialize(lesson.getQuiz());
                    });
                    return new CategoryWithPublishedLessons(category, publishedLessons);
                })
                .toList();
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
     * NOTE: ReadingArticle.viewCount is incremented and persisted on every single-article GET
     * (ReadingArticleService.findByIdWithLearningProgress) and is exposed in the response via
     * ReadingArticleMapper. That means the viewCount on articles returned from this cached list
     * can go stale between cache refreshes/evictions. This is an accepted, intentional tradeoff -
     * view count is a cosmetic counter, not worth invalidating the whole list cache on every
     * single article view.
     */
    @Cacheable("readingArticles")
    @Transactional
    public List<ReadingArticle> getAllReadingArticles() {
        List<ReadingArticle> articles = readingArticleRepository.findAll();
        initializeReadingArticles(articles);
        return articles;
    }

    /** See the viewCount staleness note on {@link #getAllReadingArticles()} - it applies here too. */
    @Cacheable("readingArticles")
    @Transactional
    public List<ReadingArticle> getReadingArticlesByLevel(LearningLevel level) {
        List<ReadingArticle> articles = readingArticleRepository.findByLevel(level);
        initializeReadingArticles(articles);
        return articles;
    }

    private void initializeReadingArticles(List<ReadingArticle> articles) {
        articles.forEach(article -> {
            Hibernate.initialize(article.getKeyVocabulary());
            Hibernate.initialize(article.getAnnotations());
            Hibernate.initialize(article.getQuiz());
            Hibernate.initialize(article.getTokens());
        });
    }

    public record CategoryWithPublishedLessons(GrammarCategory category, List<GrammarLesson> publishedLessons) {
    }
}
