package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamExerciseManualRequest;
import com.deutschbridge.backend.model.dto.ExamExercisePublicResponse;
import com.deutschbridge.backend.model.dto.ExamExerciseResponse;
import com.deutschbridge.backend.model.dto.ExamExerciseSummaryResponse;
import com.deutschbridge.backend.model.dto.ExamLevelSummaryResponse;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamExerciseCompletion;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExamAttemptRepository;
import com.deutschbridge.backend.repository.ExamExerciseCompletionRepository;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import com.deutschbridge.backend.service.cache.ContentCacheService;
import com.deutschbridge.backend.service.cache.ExamProgressCacheService;
import com.deutschbridge.backend.util.ExamExerciseMapper;
import com.deutschbridge.backend.util.UploadUrlExtractor;
import jakarta.transaction.Transactional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class ExamExerciseService {

    private static final String NOT_FOUND_MSG = "Exam exercise not found!";

    private final ExamExerciseRepository examExerciseRepository;
    private final ExamExerciseCompletionRepository examExerciseCompletionRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final RequestContext requestContext;
    private final ContentCacheService contentCacheService;
    private final ExamProgressCacheService examProgressCacheService;
    private final FileStorageService fileStorageService;

    public ExamExerciseService(ExamExerciseRepository examExerciseRepository,
                                ExamExerciseCompletionRepository examExerciseCompletionRepository,
                                ExamAttemptRepository examAttemptRepository,
                                RequestContext requestContext,
                                ContentCacheService contentCacheService,
                                ExamProgressCacheService examProgressCacheService,
                                FileStorageService fileStorageService) {
        this.examExerciseRepository = examExerciseRepository;
        this.examExerciseCompletionRepository = examExerciseCompletionRepository;
        this.examAttemptRepository = examAttemptRepository;
        this.requestContext = requestContext;
        this.contentCacheService = contentCacheService;
        this.examProgressCacheService = examProgressCacheService;
        this.fileStorageService = fileStorageService;
    }

    public ExamExercise findById(String id) throws DataNotFoundException {
        return examExerciseRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
    }

    /** Navigation/summary shape for lists (section tabs, level selector, Teil listings) - see ExamExerciseSummaryResponse. */
    public List<ExamExerciseSummaryResponse> findSummary(ExamSection section, LearningLevel level, ExamTaskType taskType) {
        List<ExamExercise> exercises = contentCacheService.getPublishedExamExercises(section, level, taskType);

        Map<String, ExamExerciseCompletion> completionsByExerciseId = examExerciseCompletionRepository.findByUserId(requestContext.getUserId()).stream()
                .collect(Collectors.toMap(ExamExerciseCompletion::getExerciseId, completion -> completion));

        return exercises.stream()
                .map(exercise -> ExamExerciseMapper.mapToSummaryResponse(exercise, completionsByExerciseId))
                .toList();
    }

    /** Per-level aggregate progress for the current user, for the level selector - see ExamLevelSummaryResponse. */
    public List<ExamLevelSummaryResponse> findLevelSummary() {
        return examProgressCacheService.getLevelSummary(requestContext.getUserId());
    }

    public ExamExercisePublicResponse findByIdPublic(String id) throws DataNotFoundException {
        ExamExercise exercise = findById(id);
        Map<String, ExamExerciseCompletion> completions = examExerciseCompletionRepository
                .findByUserIdAndExerciseId(requestContext.getUserId(), id)
                .map(completion -> Map.of(id, completion))
                .orElseGet(Map::of);
        return ExamExerciseMapper.mapToPublicResponse(exercise, completions);
    }

    @CacheEvict(cacheNames = "examLevelSummary", key = "@requestContext.getUserId()")
    public void markCompleted(String exerciseId) throws DataNotFoundException {
        findById(exerciseId);
        String userId = requestContext.getUserId();
        ExamExerciseCompletion completion = examExerciseCompletionRepository
                .findByUserIdAndExerciseId(userId, exerciseId)
                .orElseGet(() -> {
                    ExamExerciseCompletion c = new ExamExerciseCompletion();
                    c.setUserId(userId);
                    c.setExerciseId(exerciseId);
                    return c;
                });
        completion.setCompletedAt(LocalDateTime.now());
        examExerciseCompletionRepository.save(completion);
    }

    /** Upserts the most recent attempt's score onto the exercise's completion record. */
    @CacheEvict(cacheNames = "examLevelSummary", key = "@requestContext.getUserId()")
    public void saveLastScore(String exerciseId, double score) {
        String userId = requestContext.getUserId();
        ExamExerciseCompletion completion = examExerciseCompletionRepository
                .findByUserIdAndExerciseId(userId, exerciseId)
                .orElseGet(() -> {
                    ExamExerciseCompletion c = new ExamExerciseCompletion();
                    c.setUserId(userId);
                    c.setExerciseId(exerciseId);
                    return c;
                });
        completion.setLastScore(score);
        examExerciseCompletionRepository.save(completion);
    }

    @CacheEvict(cacheNames = "examLevelSummary", key = "@requestContext.getUserId()")
    public void unmarkCompleted(String exerciseId) {
        examExerciseCompletionRepository.findByUserIdAndExerciseId(requestContext.getUserId(), exerciseId)
                .ifPresent(examExerciseCompletionRepository::delete);
    }

    public List<ExamExerciseResponse> findAllForAdmin() {
        return examExerciseRepository.findAll().stream().map(ExamExerciseMapper::mapToResponse).toList();
    }

    public ExamExerciseResponse getForAdmin(String id) throws DataNotFoundException {
        return ExamExerciseMapper.mapToResponse(findById(id));
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = "examExercises", allEntries = true),
            @CacheEvict(cacheNames = "examLevelSummary", allEntries = true)
    })
    public ExamExerciseResponse createManual(ExamExerciseManualRequest request) {
        validateNoDuplicateLevel(request, null);
        ExamExercise exercise = new ExamExercise();
        applyRequest(exercise, request);
        return ExamExerciseMapper.mapToResponse(examExerciseRepository.save(exercise));
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = "examExercises", allEntries = true),
            @CacheEvict(cacheNames = "examLevelSummary", allEntries = true)
    })
    public ExamExerciseResponse update(String id, ExamExerciseManualRequest request) throws DataNotFoundException {
        ExamExercise existing = findById(id);
        validateNoDuplicateLevel(request, id);
        Set<String> previousUploadUrls = collectUploadUrls(existing);
        applyRequest(existing, request);
        ExamExercise saved = examExerciseRepository.save(existing);

        // Whatever the previous version referenced (a passage image, an inline content/transcript
        // image, ...) that the new version no longer does - e.g. an admin removed an embedded
        // image from the rich text and re-saved - has no other reference left, so its file is
        // deleted here rather than left to accumulate on disk forever.
        Set<String> currentUploadUrls = collectUploadUrls(saved);
        previousUploadUrls.stream()
                .filter(url -> !currentUploadUrls.contains(url))
                .forEach(fileStorageService::deleteFile);

        return ExamExerciseMapper.mapToResponse(saved);
    }

    /** Every "/uploads/..." URL this exercise references, across all passages' content/transcript/
     *  imageUrl/audioUrl and the exercise-level modelSolution rich text. */
    private Set<String> collectUploadUrls(ExamExercise exercise) {
        List<ExamPassage> passages = exercise.getPassages();
        String[] passageTexts = passages == null
                ? new String[0]
                : passages.stream()
                        .flatMap(p -> Stream.of(p.getContent(), p.getTranscript(), p.getImageUrl(), p.getAudioUrl()))
                        .toArray(String[]::new);
        Set<String> urls = new LinkedHashSet<>(UploadUrlExtractor.extract(passageTexts));
        urls.addAll(UploadUrlExtractor.extract(exercise.getModelSolution()));
        return urls;
    }

    /**
     * Testformat Information is meant to hold exactly one entry per level (unlike the other exam
     * sections, which intentionally allow many exercises to share a section+level). Enforced here
     * rather than with a DB constraint since every other section relies on duplicates being allowed.
     */
    private void validateNoDuplicateLevel(ExamExerciseManualRequest request, String excludeId) {
        if (request.section() != ExamSection.TESTFORMAT_INFORMATION || request.level() == null) return;
        boolean duplicate = excludeId == null
                ? examExerciseRepository.existsBySectionAndLevel(request.section(), request.level())
                : examExerciseRepository.existsBySectionAndLevelAndIdNot(request.section(), request.level(), excludeId);
        if (duplicate) {
            throw new IllegalArgumentException("Testformat Information content already exists for level " + request.level().getValue());
        }
    }

    /** Also clears attempts/completions referencing this exercise first - ExamAttempt has a
     * non-nullable FK to it, so deleting without this fails with a foreign-key violation for any
     * exercise a student has already attempted. */
    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = "examExercises", allEntries = true),
            @CacheEvict(cacheNames = "examLevelSummary", allEntries = true)
    })
    public void delete(String id) throws DataNotFoundException {
        ExamExercise exercise = findById(id);
        collectUploadUrls(exercise).forEach(fileStorageService::deleteFile);
        examAttemptRepository.deleteByExercise(exercise);
        examExerciseCompletionRepository.deleteByExerciseId(id);
        examExerciseRepository.deleteById(id);
    }

    private void applyRequest(ExamExercise exercise, ExamExerciseManualRequest request) {
        if (request.title() != null) exercise.setTitle(request.title());
        if (request.section() != null) exercise.setSection(request.section());
        if (request.taskType() != null) exercise.setTaskType(request.taskType());
        if (request.level() != null) exercise.setLevel(request.level());
        if (request.partNumber() != null) exercise.setPartNumber(request.partNumber());
        if (request.passages() != null) exercise.setPassages(preparePassages(request.passages()));
        if (request.questions() != null) exercise.setQuestions(prepareQuestions(request.questions()));
        if (request.answerOptions() != null) exercise.setAnswerOptions(request.answerOptions());
        if (request.answerOptionLabels() != null) exercise.setAnswerOptionLabels(request.answerOptionLabels());
        if (request.defaultExplanation() != null) exercise.setDefaultExplanation(request.defaultExplanation());
        if (request.defaultCommonMistake() != null) exercise.setDefaultCommonMistake(request.defaultCommonMistake());
        if (request.teilDescription() != null) exercise.setTeilDescription(request.teilDescription());
        if (request.modelSolution() != null) exercise.setModelSolution(request.modelSolution());
        if (request.published() != null) exercise.setPublished(request.published());
    }

    private List<ExamPassage> preparePassages(List<ExamPassage> passages) {
        if (passages == null) return new ArrayList<>();
        passages.forEach(ExamPassage::ensureId);
        return passages;
    }

    /**
     * Assigns each question an id, and - for any question the admin left without an explicit
     * questionNumber - a default of its position in this list (1, 2, 3...). Admin-authored order
     * is otherwise left untouched; ascending display order by questionNumber only happens when
     * building student-facing responses (see ExamExerciseMapper.mapQuestionsToPublic).
     */
    private List<ExamQuestion> prepareQuestions(List<ExamQuestion> questions) {
        if (questions == null) return new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            ExamQuestion question = questions.get(i).ensureId();
            if (question.getQuestionNumber() == null) {
                question.setQuestionNumber(i + 1);
            }
        }
        return questions;
    }
}
