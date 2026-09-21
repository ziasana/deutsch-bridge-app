package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.CategoryTestStatusResponse;
import com.deutschbridge.backend.model.dto.CategoryTestSubmitRequest;
import com.deutschbridge.backend.model.dto.GrammarCategoryAdminResponse;
import com.deutschbridge.backend.model.dto.GrammarCategoryManualRequest;
import com.deutschbridge.backend.model.dto.GrammarCategoryResponse;
import com.deutschbridge.backend.model.entity.GrammarCategory;
import com.deutschbridge.backend.model.entity.GrammarCategoryTestAttempt;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.GrammarCategoryRepository;
import com.deutschbridge.backend.repository.GrammarCategoryTestAttemptRepository;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import com.deutschbridge.backend.service.cache.ContentCacheService;
import com.deutschbridge.backend.util.GrammarLessonMapper;
import jakarta.transaction.Transactional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GrammarCategoryService {

    private static final String NOT_FOUND_MSG = "Grammar category not found!";
    private static final String NO_ATTEMPT_MSG = "No test attempt found for this category yet.";

    private final GrammarCategoryRepository categoryRepository;
    private final GrammarLessonRepository lessonRepository;
    private final GrammarCategoryTestAttemptRepository attemptRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final UserService userService;
    private final RequestContext requestContext;
    private final ContentCacheService contentCacheService;

    public GrammarCategoryService(GrammarCategoryRepository categoryRepository,
                                   GrammarLessonRepository lessonRepository,
                                   GrammarCategoryTestAttemptRepository attemptRepository,
                                   LearningProgressRepository learningProgressRepository,
                                   UserService userService,
                                   RequestContext requestContext,
                                   ContentCacheService contentCacheService) {
        this.categoryRepository = categoryRepository;
        this.lessonRepository = lessonRepository;
        this.attemptRepository = attemptRepository;
        this.learningProgressRepository = learningProgressRepository;
        this.userService = userService;
        this.requestContext = requestContext;
        this.contentCacheService = contentCacheService;
    }

    public List<GrammarCategoryAdminResponse> findAllForAdmin() {
        return categoryRepository.findAllByOrderByLevelAscSortOrderAsc().stream()
                .map(c -> new GrammarCategoryAdminResponse(
                        c.getId(),
                        c.getTitle(),
                        c.getTitleFa(),
                        c.getLevel() != null ? c.getLevel().getValue() : null,
                        c.getSortOrder(),
                        c.getPassThreshold(),
                        lessonRepository.findByCategory(c).size()
                ))
                .toList();
    }

    @CacheEvict(cacheNames = "grammarCategories", allEntries = true)
    public GrammarCategoryAdminResponse createCategory(GrammarCategoryManualRequest request) {
        if (request.title() == null || request.title().isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }
        if (request.level() == null) {
            throw new IllegalArgumentException("Level is required");
        }
        GrammarCategory category = new GrammarCategory();
        applyRequest(category, request);
        category = categoryRepository.save(category);
        return new GrammarCategoryAdminResponse(category.getId(), category.getTitle(), category.getTitleFa(),
                category.getLevel().getValue(), category.getSortOrder(), category.getPassThreshold(), 0);
    }

    @CacheEvict(cacheNames = "grammarCategories", allEntries = true)
    public GrammarCategoryAdminResponse updateCategory(String id, GrammarCategoryManualRequest request) throws DataNotFoundException {
        GrammarCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        applyRequest(category, request);
        category = categoryRepository.save(category);
        return new GrammarCategoryAdminResponse(category.getId(), category.getTitle(), category.getTitleFa(),
                category.getLevel().getValue(), category.getSortOrder(), category.getPassThreshold(),
                lessonRepository.findByCategory(category).size());
    }

    private void applyRequest(GrammarCategory category, GrammarCategoryManualRequest request) {
        if (request.title() != null) category.setTitle(request.title().trim());
        if (request.titleFa() != null) category.setTitleFa(request.titleFa());
        if (request.level() != null) category.setLevel(request.level());
        if (request.sortOrder() != null) category.setSortOrder(request.sortOrder());
        if (request.passThreshold() != null) {
            if (request.passThreshold() < 0 || request.passThreshold() > 100) {
                throw new IllegalArgumentException("Pass threshold must be between 0 and 100");
            }
            category.setPassThreshold(request.passThreshold());
        }
    }

    @Transactional
    @CacheEvict(cacheNames = {"grammarCategories", "grammarLessons"}, allEntries = true)
    public boolean deleteCategory(String id) throws DataNotFoundException {
        GrammarCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        lessonRepository.unassignCategory(category);
        attemptRepository.deleteByCategory(category);
        categoryRepository.delete(category);
        return true;
    }

    /** Learner view: published lessons only, grouped under their category, with the user's test status. */
    public List<GrammarCategoryResponse> findAllForLearner() throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        List<ContentCacheService.CategoryWithPublishedLessons> categoriesWithLessons =
                contentCacheService.getGrammarCategoriesWithPublishedLessons();
        List<GrammarCategory> categories = categoriesWithLessons.stream()
                .map(ContentCacheService.CategoryWithPublishedLessons::category)
                .toList();
        List<GrammarCategoryTestAttempt> attempts = attemptRepository.findByUserAndCategoryIn(user, categories);
        Map<String, GrammarCategoryTestAttempt> attemptByCategoryId = attempts.stream()
                .collect(Collectors.toMap(a -> a.getCategory().getId(), a -> a));

        Map<String, List<GrammarLesson>> publishedLessonsByCategoryId = categoriesWithLessons.stream()
                .collect(Collectors.toMap(c -> c.category().getId(), ContentCacheService.CategoryWithPublishedLessons::publishedLessons));

        List<GrammarLesson> allPublishedLessons = publishedLessonsByCategoryId.values().stream()
                .flatMap(List::stream)
                .toList();
        List<LearningProgress> progresses = learningProgressRepository.findByUserAndLessonIn(user, allPublishedLessons);
        Map<String, LearningProgress> progressByLessonId = progresses.stream()
                .collect(Collectors.toMap(p -> p.getLesson().getId(), p -> p, (first, second) -> first));

        return categories.stream().map(category -> {
            List<GrammarLesson> publishedLessons = publishedLessonsByCategoryId.get(category.getId());

            GrammarCategoryTestAttempt attempt = attemptByCategoryId.get(category.getId());
            CategoryTestStatusResponse status = attempt != null
                    ? new CategoryTestStatusResponse(true, attempt.getScore(), attempt.getTotal(),
                        attempt.isPassed(), attempt.isCompleted(), category.getPassThreshold())
                    : CategoryTestStatusResponse.notAttempted(category.getPassThreshold());

            return new GrammarCategoryResponse(
                    category.getId(),
                    category.getTitle(),
                    category.getTitleFa(),
                    category.getLevel() != null ? category.getLevel().getValue() : null,
                    category.getSortOrder(),
                    category.getPassThreshold(),
                    publishedLessons.stream()
                            .map(l -> GrammarLessonMapper.mapToResponse(l, progressByLessonId.get(l.getId())))
                            .toList(),
                    status
            );
        }).toList();
    }

    @Transactional
    public CategoryTestStatusResponse submitTest(String categoryId, CategoryTestSubmitRequest request) throws DataNotFoundException {
        GrammarCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        if (request.total() <= 0 || request.score() < 0 || request.score() > request.total()) {
            throw new IllegalArgumentException("Invalid score submitted");
        }
        User user = userService.findByEmail(requestContext.getUserEmail());

        GrammarCategoryTestAttempt attempt = attemptRepository.findByUserAndCategory(user, category)
                .orElseGet(() -> {
                    GrammarCategoryTestAttempt a = new GrammarCategoryTestAttempt();
                    a.setUser(user);
                    a.setCategory(category);
                    return a;
                });

        boolean passed = (request.score() * 100.0 / request.total()) >= category.getPassThreshold();
        attempt.setScore(request.score());
        attempt.setTotal(request.total());
        attempt.setPassed(passed);
        attempt.setCompleted(false);
        attemptRepository.save(attempt);

        return new CategoryTestStatusResponse(true, attempt.getScore(), attempt.getTotal(),
                attempt.isPassed(), attempt.isCompleted(), category.getPassThreshold());
    }

    @Transactional
    public CategoryTestStatusResponse markComplete(String categoryId) throws DataNotFoundException {
        GrammarCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        User user = userService.findByEmail(requestContext.getUserEmail());

        GrammarCategoryTestAttempt attempt = attemptRepository.findByUserAndCategory(user, category)
                .orElseThrow(() -> new IllegalArgumentException(NO_ATTEMPT_MSG));
        if (!attempt.isPassed()) {
            throw new IllegalArgumentException("Score must meet the passing threshold ("
                    + category.getPassThreshold() + "%) to mark this category complete.");
        }
        attempt.setCompleted(true);
        attemptRepository.save(attempt);

        return new CategoryTestStatusResponse(true, attempt.getScore(), attempt.getTotal(),
                attempt.isPassed(), attempt.isCompleted(), category.getPassThreshold());
    }
}
