package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.GrammarLessonManualRequest;
import com.deutschbridge.backend.model.dto.GrammarLessonResponse;
import com.deutschbridge.backend.model.entity.GrammarCategory;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.QuizQuestion;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.GrammarLessonStatus;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.GrammarCategoryRepository;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import com.deutschbridge.backend.util.GrammarLessonMapper;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GrammarService {
    private final GrammarLessonRepository grammarRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final GrammarCategoryRepository grammarCategoryRepository;
    private final UserService userService;
    private final RequestContext requestContext;
    private static final String NOT_FOUND_MSG= "Grammar lesson not found!";

    public GrammarService(GrammarLessonRepository grammarRepository,
                           LearningProgressRepository learningProgressRepository,
                           GrammarCategoryRepository grammarCategoryRepository,
                           UserService userService,
                           RequestContext requestContext) {
        this.grammarRepository = grammarRepository;
        this.learningProgressRepository = learningProgressRepository;
        this.grammarCategoryRepository = grammarCategoryRepository;
        this.userService = userService;
        this.requestContext = requestContext;
    }

    /** Resolves a category id from a lesson request, enforcing that its level matches the lesson's. */
    private GrammarCategory resolveCategory(String categoryId, LearningLevel level) {
        if (categoryId == null || categoryId.isBlank()) return null;
        GrammarCategory category = grammarCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + categoryId));
        if (category.getLevel() != level) {
            throw new IllegalArgumentException("Category \"" + category.getTitle() + "\" is for level "
                    + category.getLevel() + ", not " + level);
        }
        return category;
    }

    public List<GrammarLesson> findAll() {
        return grammarRepository.findAll();
    }

    public List<GrammarLessonResponse> findAllWithLearningProgress() {
        List<GrammarLesson> published = grammarRepository.getWithLearningProgress().stream()
                .filter(l -> l.getStatus() != GrammarLessonStatus.DRAFT)
                .toList();
        return mapWithCurrentUserProgress(published);
    }

    /** Admin-only: every lesson regardless of status, for the admin management list. */
    public List<GrammarLessonResponse> findAllForAdmin() {
        return grammarRepository.findAll().stream()
                .sorted(Comparator
                        .comparing((GrammarLesson l) -> l.getCategory() != null ? l.getCategory().getTitle() : "",
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(l -> l.getSortOrder() != null ? l.getSortOrder() : 0)
                        .thenComparing(GrammarLesson::getTitle))
                .map(GrammarLessonMapper::mapToAdminResponse)
                .toList();
    }

    public GrammarLessonResponse findByIdForAdmin(String id) throws DataNotFoundException {
        return GrammarLessonMapper.mapToAdminResponse(findById(id));
    }

    public GrammarLessonResponse findByIdWithLearningProgress(String id) throws DataNotFoundException {
        GrammarLesson lesson = findById(id);
        return mapWithCurrentUserProgress(List.of(lesson)).get(0);
    }

    private List<GrammarLessonResponse> mapWithCurrentUserProgress(List<GrammarLesson> lessons) {
        if (lessons.isEmpty()) return List.of();

        User user = userService.findByEmail(requestContext.getUserEmail());
        List<LearningProgress> progresses = learningProgressRepository.findByUserAndLessonIn(user, lessons);
        Map<String, LearningProgress> progressByLessonId = progresses.stream()
                .collect(Collectors.toMap(p -> p.getLesson().getId(), p -> p, (first, second) -> first));

        return lessons.stream()
                .map(l -> GrammarLessonMapper.mapToResponse(l, progressByLessonId.get(l.getId())))
                .toList();
    }

    @Transactional
    public GrammarLesson saveLesson(GrammarLesson lesson) {
        if (lesson.getQuiz() == null) lesson.setQuiz(new ArrayList<>());
        return grammarRepository.save(lesson);
    }

    @Transactional
    public List<GrammarLesson> saveAll(List<GrammarLesson> lessons) {
        for (GrammarLesson lesson : lessons) {
            if (lesson.getQuiz() == null) {
                lesson.setQuiz(new ArrayList<>());
            }
        }
        return  grammarRepository.saveAll(lessons);
    }
    public GrammarLesson findById(String id) throws DataNotFoundException {
        return grammarRepository.findById(id)
                .orElseThrow(()->new DataNotFoundException(NOT_FOUND_MSG));
    }

    @Transactional
    public boolean deleteById(String  id) throws DataNotFoundException {
        GrammarLesson lesson = grammarRepository.findById(id)
                .orElseThrow(()->new DataNotFoundException(NOT_FOUND_MSG));
        learningProgressRepository.deleteByLesson(lesson);
        grammarRepository.deleteById(id);
        return true;
    }

    /** Persian translations only make sense for beginner/intermediate lessons - from B2 up, everything stays single-language. */
    private static final Set<LearningLevel> TRANSLATABLE_LEVELS = Set.of(LearningLevel.A1, LearningLevel.A2, LearningLevel.B1);

    public GrammarLessonResponse createManual(GrammarLessonManualRequest request) {
        GrammarLesson lesson = new GrammarLesson();
        lesson.setTitle(request.title());
        lesson.setLevel(request.level());
        lesson.setSummary(request.summary());
        lesson.setContent(request.content());
        lesson.setExample(request.example());
        lesson.setUsageTips(request.usageTips());
        lesson.setTitleFa(request.titleFa());
        lesson.setSummaryFa(request.summaryFa());
        lesson.setContentFa(request.contentFa());
        lesson.setExampleFa(request.exampleFa());
        lesson.setUsageTipsFa(request.usageTipsFa());
        lesson.setVideoLink(request.videoLink());
        lesson.setStatus(request.status() != null ? request.status() : GrammarLessonStatus.DRAFT);
        lesson.setQuiz(prepareQuiz(request.quiz(), lesson.getLevel()));
        lesson.setCategory(resolveCategory(request.categoryId(), lesson.getLevel()));
        lesson.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 0);
        clearFaFieldsIfNotTranslatable(lesson);

        return GrammarLessonMapper.mapToAdminResponse(grammarRepository.save(lesson));
    }

    public GrammarLessonResponse updateManual(String id, GrammarLessonManualRequest request) throws DataNotFoundException {
        GrammarLesson existing = grammarRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));

        if (request.title() != null) existing.setTitle(request.title());
        if (request.level() != null) existing.setLevel(request.level());
        if (request.summary() != null) existing.setSummary(request.summary());
        if (request.content() != null) existing.setContent(request.content());
        if (request.example() != null) existing.setExample(request.example());
        if (request.usageTips() != null) existing.setUsageTips(request.usageTips());
        if (request.titleFa() != null) existing.setTitleFa(request.titleFa());
        if (request.summaryFa() != null) existing.setSummaryFa(request.summaryFa());
        if (request.contentFa() != null) existing.setContentFa(request.contentFa());
        if (request.exampleFa() != null) existing.setExampleFa(request.exampleFa());
        if (request.usageTipsFa() != null) existing.setUsageTipsFa(request.usageTipsFa());
        if (request.videoLink() != null) existing.setVideoLink(request.videoLink());
        if (request.status() != null) existing.setStatus(request.status());
        if (request.quiz() != null) existing.setQuiz(prepareQuiz(request.quiz(), existing.getLevel()));
        existing.setCategory(resolveCategory(request.categoryId(), existing.getLevel()));
        if (request.sortOrder() != null) existing.setSortOrder(request.sortOrder());
        clearFaFieldsIfNotTranslatable(existing);

        return GrammarLessonMapper.mapToAdminResponse(grammarRepository.save(existing));
    }

    private void clearFaFieldsIfNotTranslatable(GrammarLesson lesson) {
        if (TRANSLATABLE_LEVELS.contains(lesson.getLevel())) return;
        lesson.setTitleFa(null);
        lesson.setSummaryFa(null);
        lesson.setContentFa(null);
        lesson.setExampleFa(null);
        lesson.setUsageTipsFa(null);
        if (lesson.getQuiz() != null) {
            lesson.getQuiz().forEach(q -> {
                q.setTitleFa(null);
                q.setQuestionFa(null);
            });
        }
    }

    private List<QuizQuestion> prepareQuiz(List<QuizQuestion> quiz, LearningLevel level) {
        List<QuizQuestion> prepared = quiz != null ? quiz : new ArrayList<>();
        if (!TRANSLATABLE_LEVELS.contains(level)) {
            prepared.forEach(q -> {
                q.setTitleFa(null);
                q.setQuestionFa(null);
            });
        }
        return prepared;
    }

    /**
     * Imports a batch of lessons all-or-nothing: every lesson (and its exercises) is validated
     * first, and if any fails, nothing is saved. Imported lessons always land as DRAFT so an
     * admin reviews and publishes them individually.
     */
    @Transactional
    public List<GrammarLessonResponse> bulkImport(List<GrammarLessonManualRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new IllegalArgumentException("No lessons to import");
        }

        List<String> errors = new ArrayList<>();
        Set<String> seenTitles = new java.util.HashSet<>();

        for (int i = 0; i < requests.size(); i++) {
            GrammarLessonManualRequest request = requests.get(i);
            String label = "Lesson " + (i + 1)
                    + (request.title() != null && !request.title().isBlank() ? " (\"" + request.title() + "\")" : "");

            if (request.title() == null || request.title().isBlank()) {
                errors.add(label + ": title is required");
            } else {
                String normalizedTitle = request.title().trim().toLowerCase();
                if (!seenTitles.add(normalizedTitle)) {
                    errors.add(label + ": duplicate title within the uploaded batch");
                } else if (grammarRepository.existsByTitleIgnoreCase(request.title().trim())) {
                    errors.add(label + ": a lesson with this title already exists");
                }
            }

            if (request.level() == null) {
                errors.add(label + ": level is required");
            }
            if (request.content() == null || request.content().isBlank()) {
                errors.add(label + ": content is required");
            }

            if (request.categoryId() != null && !request.categoryId().isBlank()) {
                GrammarCategory category = grammarCategoryRepository.findById(request.categoryId()).orElse(null);
                if (category == null) {
                    errors.add(label + ": category not found: " + request.categoryId());
                } else if (request.level() != null && category.getLevel() != request.level()) {
                    errors.add(label + ": category \"" + category.getTitle() + "\" is for level "
                            + category.getLevel() + ", not " + request.level());
                }
            }

            List<QuizQuestion> quiz = request.quiz();
            if (quiz != null) {
                for (int q = 0; q < quiz.size(); q++) {
                    QuizQuestion question = quiz.get(q);
                    String qLabel = label + ", exercise " + (q + 1);
                    if (question.getType() == null || question.getType().isBlank()) {
                        errors.add(qLabel + ": type is required");
                    }
                    if (question.getQuestion() == null || question.getQuestion().isBlank()) {
                        errors.add(qLabel + ": question is required");
                    }
                    if (question.getAnswer() == null) {
                        errors.add(qLabel + ": answer is required");
                    }
                    if ("mcq".equalsIgnoreCase(question.getType())
                            && (question.getOptions() == null || question.getOptions().size() < 2)) {
                        errors.add(qLabel + ": mcq requires at least 2 options");
                    }
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException("Bulk import failed:\n" + String.join("\n", errors));
        }

        List<GrammarLesson> lessons = requests.stream().map(request -> {
            GrammarLesson lesson = new GrammarLesson();
            lesson.setTitle(request.title().trim());
            lesson.setLevel(request.level());
            lesson.setSummary(request.summary());
            lesson.setContent(request.content());
            lesson.setExample(request.example());
            lesson.setUsageTips(request.usageTips());
            lesson.setTitleFa(request.titleFa());
            lesson.setSummaryFa(request.summaryFa());
            lesson.setContentFa(request.contentFa());
            lesson.setExampleFa(request.exampleFa());
            lesson.setUsageTipsFa(request.usageTipsFa());
            lesson.setVideoLink(request.videoLink());
            lesson.setStatus(GrammarLessonStatus.DRAFT);
            lesson.setQuiz(prepareQuiz(request.quiz(), lesson.getLevel()));
            lesson.setCategory(resolveCategory(request.categoryId(), lesson.getLevel()));
            lesson.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 0);
            clearFaFieldsIfNotTranslatable(lesson);
            return lesson;
        }).toList();

        return grammarRepository.saveAll(lessons).stream()
                .map(GrammarLessonMapper::mapToAdminResponse)
                .toList();
    }
}
