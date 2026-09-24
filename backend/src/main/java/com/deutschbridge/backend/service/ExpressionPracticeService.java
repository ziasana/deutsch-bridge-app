package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.*;
import com.deutschbridge.backend.model.entity.*;
import com.deutschbridge.backend.model.enums.ExpressionMasteryLevel;
import com.deutschbridge.backend.model.enums.ExpressionQuestionType;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import com.deutschbridge.backend.model.enums.LearningActivityType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.LearningModule;
import com.deutschbridge.backend.repository.ExpressionProgressRepository;
import com.deutschbridge.backend.repository.ExpressionQuestionOptionRepository;
import com.deutschbridge.backend.repository.ExpressionQuestionRepository;
import com.deutschbridge.backend.repository.ExpressionRepository;
import com.deutschbridge.backend.util.ExpressionMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Drives the LEARN -> RECALL -> [CONTEXT/COMPLETION/TRANSFORMATION] -> PRODUCE -> FEEDBACK -> REVIEW
 * loop (spec section 5-12). Recall and the admin-authored multiple-choice questions (CONTEXT,
 * COMPLETION, TRANSFORMATION-MCQ) are graded deterministically; Production and free-text
 * TRANSFORMATION are graded by the AI teacher via OllamaService, since natural-language feedback
 * can't be done deterministically. Production carries the most weight and is the only step that
 * advances the SM-2 spaced-repetition schedule, so an expression can't reach MASTERED (or ACTIVE -
 * see ExpressionMapper.computeMasteryLevel) from the other axes alone (spec section 6/14).
 *
 * Each session rotates a random 1-2 warm-up steps (from whichever of RECALL/CONTEXT/COMPLETION/
 * TRANSFORMATION have content available for that expression) ahead of Production, so repeated
 * reviews of the same expression don't always look identical (spec section 16/23).
 */
@Service
public class ExpressionPracticeService {

    private static final int SESSION_SIZE = 5;
    private static final int MAX_WARMUP_STEPS = 2;
    private static final double MIN_EASE_FACTOR = 1.3;
    private static final Set<String> GERMAN_ARTICLES = Set.of(
            "ein", "eine", "einen", "einem", "einer", "eines",
            "der", "die", "das", "den", "dem", "des"
    );

    private final ExpressionRepository expressionRepository;
    private final ExpressionProgressRepository expressionProgressRepository;
    private final ExpressionQuestionRepository expressionQuestionRepository;
    private final ExpressionQuestionOptionRepository expressionQuestionOptionRepository;
    private final UserService userService;
    private final RequestContext requestContext;
    private final OllamaService ollamaService;
    private final LearningActivityService learningActivityService;
    private final Random random = new Random();

    public ExpressionPracticeService(ExpressionRepository expressionRepository,
                                      ExpressionProgressRepository expressionProgressRepository,
                                      ExpressionQuestionRepository expressionQuestionRepository,
                                      ExpressionQuestionOptionRepository expressionQuestionOptionRepository,
                                      UserService userService,
                                      RequestContext requestContext,
                                      OllamaService ollamaService,
                                      LearningActivityService learningActivityService) {
        this.expressionRepository = expressionRepository;
        this.expressionProgressRepository = expressionProgressRepository;
        this.expressionQuestionRepository = expressionQuestionRepository;
        this.expressionQuestionOptionRepository = expressionQuestionOptionRepository;
        this.userService = userService;
        this.requestContext = requestContext;
        this.ollamaService = ollamaService;
        this.learningActivityService = learningActivityService;
    }

    /** A session made of exactly one expression, for practicing it on demand from its detail page or list card. */
    public PracticeSessionResponse getSessionForExpression(String expressionId) throws DataNotFoundException {
        Expression expression = expressionRepository.findById(expressionId)
                .orElseThrow(() -> new DataNotFoundException("Expression not found!"));
        if (expression.getStatus() == ExpressionStatus.DRAFT) {
            throw new DataNotFoundException("Expression not found!");
        }

        User user = userService.findByEmail(requestContext.getUserEmail());
        ExpressionProgress progress = expressionProgressRepository.findByUserAndExpression(user, expression).orElse(null);
        boolean isNew = progress == null;

        PracticeExpressionDto dto = toPracticeDto(expression, progress, isNew);
        return new PracticeSessionResponse(List.of(dto), isNew ? 1 : 0, isNew ? 0 : 1);
    }

    public PracticeSessionResponse getSession() {
        User user = userService.findByEmail(requestContext.getUserEmail());
        List<Expression> published = expressionRepository.findAll().stream()
                .filter(e -> e.getStatus() != ExpressionStatus.DRAFT)
                .toList();

        List<ExpressionProgress> progresses = expressionProgressRepository.findByUserAndExpressionIn(user, published);
        Map<String, ExpressionProgress> progressByExpressionId = new HashMap<>();
        for (ExpressionProgress p : progresses) {
            progressByExpressionId.put(p.getExpression().getId(), p);
        }

        LocalDateTime now = LocalDateTime.now();
        List<Expression> due = new ArrayList<>();
        List<Expression> fresh = new ArrayList<>();
        for (Expression e : published) {
            ExpressionProgress progress = progressByExpressionId.get(e.getId());
            if (progress == null) {
                fresh.add(e);
            } else if (progress.getMasteryLevel() != ExpressionMasteryLevel.MASTERED
                    && (progress.getNextReviewAt() == null || !progress.getNextReviewAt().isAfter(now))) {
                due.add(e);
            }
        }
        due.sort(Comparator.comparing(e -> {
            LocalDateTime dueAt = progressByExpressionId.get(e.getId()).getNextReviewAt();
            return dueAt == null ? LocalDateTime.MIN : dueAt;
        }));

        List<Expression> items = new ArrayList<>();
        for (Expression e : due) {
            if (items.size() >= SESSION_SIZE) break;
            items.add(e);
        }
        for (Expression e : fresh) {
            if (items.size() >= SESSION_SIZE) break;
            items.add(e);
        }

        int newCount = 0;
        List<PracticeExpressionDto> dtos = new ArrayList<>();
        for (Expression e : items) {
            ExpressionProgress progress = progressByExpressionId.get(e.getId());
            boolean isNew = progress == null;
            if (isNew) newCount++;
            dtos.add(toPracticeDto(e, progress, isNew));
        }

        return new PracticeSessionResponse(dtos, newCount, dtos.size() - newCount);
    }

    public RecallAnswerResponse submitRecall(RecallAnswerRequest request) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        Expression expression = expressionRepository.findById(request.expressionId())
                .orElseThrow(() -> new DataNotFoundException("Expression not found!"));
        ExpressionProgress progress = getOrCreateProgress(user, expression);

        boolean correct = normalizeForComparison(request.userAnswer()).equals(normalizeForComparison(expression.getExpression()));

        progress.setRecallScore(clamp(progress.getRecallScore() + (correct ? 20 : -10)));
        markAnswered(progress, correct);
        expressionProgressRepository.save(progress);
        learningActivityService.track(user.getId(), LearningModule.EXPRESSIONS, LearningActivityType.EXPRESSION_PRACTICED, expression.getId());

        return new RecallAnswerResponse(correct, expression.getExpression(), ExpressionMapper.mapProgress(progress));
    }

    /** Grades CONTEXT, COMPLETION, and multiple-choice TRANSFORMATION questions - all deterministic. */
    public QuestionAnswerResponse submitQuestion(QuestionAnswerRequest request) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        Expression expression = expressionRepository.findById(request.expressionId())
                .orElseThrow(() -> new DataNotFoundException("Expression not found!"));
        ExpressionQuestion question = expressionQuestionRepository.findById(request.questionId())
                .orElseThrow(() -> new DataNotFoundException("Question not found!"));
        ExpressionQuestionOption selected = expressionQuestionOptionRepository.findById(request.selectedOptionId())
                .orElseThrow(() -> new DataNotFoundException("Option not found!"));

        ExpressionProgress progress = getOrCreateProgress(user, expression);
        boolean correct = selected.isCorrect();
        double delta = correct ? 20 : -10;

        switch (question.getType()) {
            case CONTEXT -> progress.setContextScore(clamp(progress.getContextScore() + delta));
            // Completion tests recognizing/recalling the correct form in context - same axis as
            // typed recall, just multiple-choice instead of free entry.
            case COMPLETION -> progress.setRecallScore(clamp(progress.getRecallScore() + delta));
            case TRANSFORMATION -> progress.setTransformationScore(clamp(progress.getTransformationScore() + delta));
        }
        markAnswered(progress, correct);
        expressionProgressRepository.save(progress);
        learningActivityService.track(user.getId(), LearningModule.EXPRESSIONS, LearningActivityType.EXPRESSION_PRACTICED, expression.getId());

        String correctOptionId = question.getOptions().stream()
                .filter(ExpressionQuestionOption::isCorrect)
                .map(ExpressionQuestionOption::getId)
                .findFirst()
                .orElse(null);

        return new QuestionAnswerResponse(correct, correctOptionId, question.getExplanation(), ExpressionMapper.mapProgress(progress));
    }

    /** Grades free-text TRANSFORMATION answers via the AI teacher, like Production. */
    public TransformationAnswerResponse submitTransformation(TransformationAnswerRequest request) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        Expression expression = expressionRepository.findById(request.expressionId())
                .orElseThrow(() -> new DataNotFoundException("Expression not found!"));
        ExpressionQuestion question = expressionQuestionRepository.findById(request.questionId())
                .orElseThrow(() -> new DataNotFoundException("Question not found!"));
        ExpressionProgress progress = getOrCreateProgress(user, expression);

        LearningLevel level = expression.getLevel() != null ? expression.getLevel() : LearningLevel.B1;
        String rawAiResponse = ollamaService.evaluateTransformation(
                question.getPrompt(), expression.getExpression(), expression.getMeaningDe(), level, request.sentence());
        Map<String, String> parsed = parseAiResponse(rawAiResponse);

        boolean usedExpression = parseBool(parsed.get("USED_EXPRESSION"));
        boolean grammarCorrect = parseBool(parsed.get("GRAMMAR_CORRECT"));
        boolean meaningPreserved = parseBool(parsed.get("MEANING_PRESERVED"));
        String feedback = parsed.getOrDefault("FEEDBACK", "");
        String c1Suggestion = parsed.get("C1_SUGGESTION");
        if (c1Suggestion != null && c1Suggestion.strip().equals("-")) {
            c1Suggestion = null;
        }

        boolean correct = usedExpression && grammarCorrect;
        double delta;
        if (usedExpression && grammarCorrect && meaningPreserved) {
            delta = 25;
        } else if (usedExpression && grammarCorrect) {
            delta = 15;
        } else if (usedExpression) {
            delta = 5;
        } else {
            delta = -10;
        }
        progress.setTransformationScore(clamp(progress.getTransformationScore() + delta));
        markAnswered(progress, correct);
        expressionProgressRepository.save(progress);
        learningActivityService.track(user.getId(), LearningModule.EXPRESSIONS, LearningActivityType.EXPRESSION_PRACTICED, expression.getId());

        return new TransformationAnswerResponse(usedExpression, grammarCorrect, meaningPreserved, feedback, c1Suggestion,
                ExpressionMapper.mapProgress(progress));
    }

    public ProductionAnswerResponse submitProduction(ProductionAnswerRequest request) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        Expression expression = expressionRepository.findById(request.expressionId())
                .orElseThrow(() -> new DataNotFoundException("Expression not found!"));
        ExpressionProgress progress = getOrCreateProgress(user, expression);

        LearningLevel level = expression.getLevel() != null ? expression.getLevel() : LearningLevel.B1;
        String rawAiResponse = ollamaService.evaluateExpressionProduction(
                expression.getExpression(), expression.getMeaningDe(), level, request.sentence());
        Map<String, String> parsed = parseAiResponse(rawAiResponse);

        boolean usedCorrectly = parseBool(parsed.get("USED_CORRECTLY"));
        boolean grammarCorrect = parseBool(parsed.get("GRAMMAR_CORRECT"));
        boolean natural = parseBool(parsed.get("NATURAL"));
        String feedback = parsed.getOrDefault("FEEDBACK", "");
        String c1Suggestion = parsed.get("C1_SUGGESTION");
        if (c1Suggestion != null && c1Suggestion.strip().equals("-")) {
            c1Suggestion = null;
        }

        boolean correct = usedCorrectly && grammarCorrect;
        double delta;
        if (usedCorrectly && grammarCorrect && natural) {
            delta = 25;
        } else if (usedCorrectly && grammarCorrect) {
            delta = 15;
        } else if (usedCorrectly) {
            delta = 5;
        } else {
            delta = -10;
        }
        progress.setProductionScore(clamp(progress.getProductionScore() + delta));
        progress.setReviewCount(progress.getReviewCount() + 1);
        markAnswered(progress, correct);
        applySm2(progress, correct);
        expressionProgressRepository.save(progress);
        learningActivityService.track(user.getId(), LearningModule.EXPRESSIONS, LearningActivityType.EXPRESSION_PRACTICED, expression.getId());

        return new ProductionAnswerResponse(usedCorrectly, grammarCorrect, natural, feedback, c1Suggestion,
                ExpressionMapper.mapProgress(progress));
    }

    private void markAnswered(ExpressionProgress progress, boolean correct) {
        if (correct) {
            progress.setCorrectCount(progress.getCorrectCount() + 1);
        } else {
            progress.setIncorrectCount(progress.getIncorrectCount() + 1);
        }
        progress.setLastReviewedAt(LocalDateTime.now());
        progress.setMasteryLevel(ExpressionMapper.computeMasteryLevel(progress));
    }

    private ExpressionProgress getOrCreateProgress(User user, Expression expression) {
        return expressionProgressRepository.findByUserAndExpression(user, expression)
                .orElseGet(() -> {
                    ExpressionProgress created = new ExpressionProgress();
                    created.setUser(user);
                    created.setExpression(expression);
                    return created;
                });
    }

    private void applySm2(ExpressionProgress progress, boolean correct) {
        LocalDateTime now = LocalDateTime.now();
        if (correct) {
            int repetitions = progress.getSrsRepetitions() + 1;
            int interval = switch (repetitions) {
                case 1 -> 1;
                case 2 -> 6;
                default -> (int) Math.round(Math.max(progress.getSrsInterval(), 1) * progress.getSrsEaseFactor());
            };
            progress.setSrsRepetitions(repetitions);
            progress.setSrsInterval(interval);
            progress.setSrsEaseFactor(progress.getSrsEaseFactor() + 0.1);
            progress.setNextReviewAt(now.plusDays(interval));
        } else {
            progress.setSrsRepetitions(0);
            progress.setSrsInterval(1);
            progress.setSrsEaseFactor(Math.max(MIN_EASE_FACTOR, progress.getSrsEaseFactor() - 0.2));
            progress.setNextReviewAt(now.plusDays(1));
        }
    }

    private PracticeExpressionDto toPracticeDto(Expression e, ExpressionProgress progress, boolean isNew) {
        ExpressionExample example = e.getExamples().isEmpty() ? null : e.getExamples().get(0);
        String exampleSentence = example != null ? example.getSentence() : null;
        String maskedSentence = maskExpression(exampleSentence, e.getExpression());

        List<ExpressionQuestion> contextQuestions = questionsOfType(e, ExpressionQuestionType.CONTEXT);
        List<ExpressionQuestion> completionQuestions = questionsOfType(e, ExpressionQuestionType.COMPLETION);
        List<ExpressionQuestion> transformationQuestions = questionsOfType(e, ExpressionQuestionType.TRANSFORMATION);

        List<String> pool = new ArrayList<>();
        pool.add("RECALL"); // always available - doesn't need authored content
        if (!contextQuestions.isEmpty()) pool.add("CONTEXT");
        if (!completionQuestions.isEmpty()) pool.add("COMPLETION");
        if (!transformationQuestions.isEmpty()) pool.add("TRANSFORMATION");
        Collections.shuffle(pool, random);

        int warmupCount = Math.min(pool.size(), 1 + random.nextInt(MAX_WARMUP_STEPS));
        List<String> warmupSteps = new ArrayList<>(pool.subList(0, warmupCount));

        PracticeQuestionDto contextQuestion = warmupSteps.contains("CONTEXT")
                ? mapPracticeQuestion(randomOf(contextQuestions)) : null;
        PracticeQuestionDto completionQuestion = warmupSteps.contains("COMPLETION")
                ? mapPracticeQuestion(randomOf(completionQuestions)) : null;
        PracticeQuestionDto transformationQuestion = warmupSteps.contains("TRANSFORMATION")
                ? mapPracticeQuestion(randomOf(transformationQuestions)) : null;

        return new PracticeExpressionDto(
                e.getId(),
                e.getType() != null ? e.getType().name() : null,
                e.getExpression(),
                e.getLevel() != null ? e.getLevel().getValue() : null,
                e.getMeaningDe(),
                e.getMeaningEn(),
                e.getMeaningFa(),
                e.getGrammarNote(),
                exampleSentence,
                maskedSentence,
                progress != null && progress.getMasteryLevel() != null ? progress.getMasteryLevel().name() : ExpressionMasteryLevel.NEW.name(),
                isNew,
                warmupSteps,
                contextQuestion,
                completionQuestion,
                transformationQuestion
        );
    }

    private List<ExpressionQuestion> questionsOfType(Expression e, ExpressionQuestionType type) {
        return e.getQuestions().stream().filter(q -> q.getType() == type).toList();
    }

    private ExpressionQuestion randomOf(List<ExpressionQuestion> questions) {
        return questions.get(random.nextInt(questions.size()));
    }

    /** No correct-answer info here - only revealed via QuestionAnswerResponse after the learner submits. */
    private PracticeQuestionDto mapPracticeQuestion(ExpressionQuestion q) {
        List<ExpressionQuestionOption> shuffledOptions = new ArrayList<>(q.getOptions());
        Collections.shuffle(shuffledOptions, random);
        List<PracticeQuestionOptionDto> options = shuffledOptions.stream()
                .map(o -> new PracticeQuestionOptionDto(o.getId(), o.getText()))
                .toList();

        return new PracticeQuestionDto(
                q.getId(),
                q.getType() != null ? q.getType().name() : null,
                q.getFormat() != null ? q.getFormat().name() : null,
                q.getPrompt(),
                options
        );
    }

    private String maskExpression(String sentence, String expression) {
        if (sentence == null || expression == null) return null;
        Pattern pattern = Pattern.compile(Pattern.quote(expression), Pattern.CASE_INSENSITIVE);
        if (!pattern.matcher(sentence).find()) return null;
        return pattern.matcher(sentence).replaceFirst("______");
    }

    private String normalizeForComparison(String text) {
        if (text == null) return "";
        String cleaned = text.toLowerCase().replaceAll("[^\\p{L}\\p{N}\\s]", " ");
        List<String> tokens = new ArrayList<>();
        for (String token : cleaned.split("\\s+")) {
            if (token.isBlank() || GERMAN_ARTICLES.contains(token)) continue;
            tokens.add(token);
        }
        Collections.sort(tokens);
        return String.join(" ", tokens);
    }

    private Map<String, String> parseAiResponse(String raw) {
        Map<String, String> result = new HashMap<>();
        if (raw == null) return result;
        for (String line : raw.split("\n")) {
            int separatorIndex = line.indexOf('|');
            if (separatorIndex < 0) continue;
            String key = line.substring(0, separatorIndex).trim().toUpperCase();
            String value = line.substring(separatorIndex + 1).trim();
            result.put(key, value);
        }
        return result;
    }

    private boolean parseBool(String value) {
        return value != null && value.strip().equalsIgnoreCase("true");
    }

    private double clamp(double value) {
        return Math.max(0, Math.min(100, value));
    }
}
