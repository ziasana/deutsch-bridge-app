package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.WritingAttemptRequest;
import com.deutschbridge.backend.model.dto.WritingAttemptResponse;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.exception.AiGenerationException;
import com.deutschbridge.backend.model.dto.WritingAiFeedback;
import com.deutschbridge.backend.model.dto.WritingFeedback;
import com.deutschbridge.backend.model.dto.WritingProgressResponse;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.util.WritingAiFeedbackParser;
import com.deutschbridge.backend.model.entity.WritingAttempt;
import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.WritingMode;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import com.deutschbridge.backend.repository.WritingAttemptRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@Service
public class WritingAttemptService {

    static final int MAX_TEXT_LENGTH = 10_000;
    static final int RECENT_ATTEMPTS = 10;
    static final int MAX_RECENT_FIXES = 5;

    private final WritingAttemptRepository attemptRepository;
    private final ExamExerciseRepository exerciseRepository;
    private final RequestContext requestContext;
    private final ObjectMapper objectMapper;
    private final WritingFeedbackAnalyzer analyzer;
    private final WritingPhraseRepository phraseRepository;
    private final OllamaService ollamaService;

    public WritingAttemptService(WritingAttemptRepository attemptRepository,
                                 ExamExerciseRepository exerciseRepository,
                                 RequestContext requestContext,
                                 ObjectMapper objectMapper,
                                 WritingFeedbackAnalyzer analyzer,
                                 WritingPhraseRepository phraseRepository,
                                 OllamaService ollamaService) {
        this.attemptRepository = attemptRepository;
        this.exerciseRepository = exerciseRepository;
        this.requestContext = requestContext;
        this.objectMapper = objectMapper;
        this.analyzer = analyzer;
        this.phraseRepository = phraseRepository;
        this.ollamaService = ollamaService;
    }

    public WritingAttemptResponse submit(WritingAttemptRequest request) throws DataNotFoundException {
        ExamExercise exercise = exerciseRepository.findById(request.exerciseId())
                .orElseThrow(() -> new DataNotFoundException("Exercise not found!"));
        if (exercise.getSection() != ExamSection.SCHRIFTLICHER_AUSDRUCK) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a writing exercise.");
        }
        String text = request.text() == null ? "" : request.text().strip();
        if (text.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Text must not be empty.");
        }
        if (text.length() > MAX_TEXT_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Text is too long.");
        }

        String userId = requestContext.getUserId();
        WritingAttempt attempt = new WritingAttempt();
        attempt.setUserId(userId);
        attempt.setExerciseId(exercise.getId());
        attempt.setLevel(exercise.getLevel() != null ? exercise.getLevel().getValue() : null);
        attempt.setMode(request.mode() != null ? request.mode() : WritingMode.PRACTICE);
        attempt.setText(text);
        attempt.setWordCount(countWords(text));
        attempt.setAttemptNumber(attemptRepository.countByUserIdAndExerciseId(userId, exercise.getId()) + 1);
        attempt.setParentAttemptId(request.parentAttemptId());
        if (request.planNotes() != null && request.planNotes().stream().anyMatch(n -> n != null && !n.isBlank())) {
            try {
                attempt.setPlanNotes(objectMapper.writeValueAsString(request.planNotes()));
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid plan notes.");
            }
        }
        attempt.setFeedback(buildFeedback(exercise, text));
        return toResponse(attemptRepository.save(attempt));
    }

    private String buildFeedback(ExamExercise exercise, String text) {
        List<String> phrases = exercise.getLevel() == null ? List.of()
                : phraseRepository.findByLevelAndActiveTrueOrderByCategoryAscSortOrderAsc(exercise.getLevel()).stream()
                .map(WritingPhrase::getPhrase).toList();
        List<String> leitpunkte = exercise.getLeitpunkte() != null ? exercise.getLeitpunkte() : List.of();
        try {
            return objectMapper.writeValueAsString(analyzer.analyze(text, exercise.getLevel(), leitpunkte, phrases));
        } catch (Exception e) {
            // Feedback is an enhancement: a failure here must never lose the learner's submission.
            return null;
        }
    }

    /**
     * Generates (once) AI feedback for the caller's own attempt. It is an optional enhancement: the
     * rule-based feedback already exists, and a failure here leaves the attempt untouched. A repeated
     * request returns the stored result without using up another AI quota unit.
     */
    public WritingAttemptResponse requestAiFeedback(String attemptId) throws DataNotFoundException {
        WritingAttempt attempt = attemptRepository.findById(attemptId)
                .filter(a -> a.getUserId().equals(requestContext.getUserId()))
                .orElseThrow(() -> new DataNotFoundException("Attempt not found!"));
        if (attempt.getAiFeedback() != null) {
            return toResponse(attempt);
        }
        ExamExercise exercise = exerciseRepository.findById(attempt.getExerciseId())
                .orElseThrow(() -> new DataNotFoundException("Exercise not found!"));

        String taskText = exercise.getPassages() == null ? "" : exercise.getPassages().stream()
                .map(p -> p.getContent() == null ? "" : p.getContent().replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").strip())
                .filter(t -> !t.isEmpty()).collect(java.util.stream.Collectors.joining("\n"));
        List<String> leitpunkte = exercise.getLeitpunkte() != null ? exercise.getLeitpunkte() : List.of();
        LearningLevel level = exercise.getLevel() != null ? exercise.getLevel() : LearningLevel.B1;

        WritingAiFeedback parsed = WritingAiFeedbackParser.parse(
                ollamaService.evaluateWriting(level, taskText, leitpunkte, attempt.getText()));
        if (parsed.isEmpty()) {
            throw new AiGenerationException("The AI feedback could not be read. Please try again.", null);
        }
        try {
            attempt.setAiFeedback(objectMapper.writeValueAsString(parsed));
        } catch (Exception e) {
            throw new AiGenerationException("The AI feedback could not be saved. Please try again.", e);
        }
        return toResponse(attemptRepository.save(attempt));
    }

    /** Aggregates the caller's attempts; issue counts only look at the most recent attempts so they reflect current weaknesses. */
    public WritingProgressResponse progress() {
        List<WritingAttempt> all = attemptRepository.findByUserIdOrderBySubmittedAtDesc(requestContext.getUserId());
        java.util.Map<String, WritingProgressResponse.Issue> issues = new java.util.LinkedHashMap<>();
        List<WritingAiFeedback.GrammarFix> fixes = new java.util.ArrayList<>();

        List<WritingAttemptResponse> recent = all.stream().limit(RECENT_ATTEMPTS).map(this::toResponse).toList();
        for (WritingAttemptResponse a : recent) {
            if (a.feedback() != null) {
                for (WritingFeedback.Dimension d : a.feedback().dimensions()) {
                    if (!"NOT_ASSESSED".equals(d.status()) && !d.improvements().isEmpty()) {
                        issues.merge(d.key(), new WritingProgressResponse.Issue(d.key(), d.title(), 1),
                                (x, y) -> new WritingProgressResponse.Issue(x.key(), x.title(), x.count() + 1));
                    }
                }
            }
            if (a.aiFeedback() != null && fixes.size() < MAX_RECENT_FIXES) {
                for (WritingAiFeedback.GrammarFix fix : a.aiFeedback().grammar()) {
                    if (fixes.size() < MAX_RECENT_FIXES) fixes.add(fix);
                }
            }
        }
        List<WritingProgressResponse.Issue> top = issues.values().stream()
                .sorted(java.util.Comparator.comparingInt(WritingProgressResponse.Issue::count).reversed())
                .limit(3).toList();

        return new WritingProgressResponse(
                all.size(),
                (int) all.stream().map(WritingAttempt::getExerciseId).distinct().count(),
                (int) all.stream().filter(a -> a.getParentAttemptId() != null).count(),
                all.stream().mapToInt(WritingAttempt::getWordCount).sum(),
                all.isEmpty() ? null : all.get(0).getSubmittedAt(),
                top, fixes);
    }

    public List<WritingAttemptResponse> list(String exerciseId) {
        return attemptRepository.findByUserIdAndExerciseIdOrderByAttemptNumberAsc(requestContext.getUserId(), exerciseId)
                .stream().map(this::toResponse).toList();
    }

    static int countWords(String text) {
        return text.isBlank() ? 0 : text.trim().split("\\s+").length;
    }

    private WritingAttemptResponse toResponse(WritingAttempt a) {
        List<String> notes = List.of();
        if (a.getPlanNotes() != null) {
            try {
                notes = objectMapper.readValue(a.getPlanNotes(), new TypeReference<List<String>>() { });
            } catch (Exception ignored) {
                // Stored notes are optional context; fall back to none.
            }
        }
        WritingFeedback feedback = null;
        if (a.getFeedback() != null) {
            try {
                feedback = objectMapper.readValue(a.getFeedback(), WritingFeedback.class);
            } catch (Exception ignored) {
                // Unreadable stored feedback is shown as "no feedback".
            }
        }
        WritingAiFeedback aiFeedback = null;
        if (a.getAiFeedback() != null) {
            try {
                aiFeedback = objectMapper.readValue(a.getAiFeedback(), WritingAiFeedback.class);
            } catch (Exception ignored) {
                // Unreadable stored AI feedback is shown as "not requested".
            }
        }
        return new WritingAttemptResponse(a.getId(), a.getExerciseId(), a.getMode().name(), a.getText(), notes,
                a.getWordCount(), a.getAttemptNumber(), a.getParentAttemptId(), a.getSubmittedAt(), feedback, aiFeedback);
    }
}
