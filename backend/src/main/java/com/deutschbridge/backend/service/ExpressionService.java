package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExpressionBulkImportResult;
import com.deutschbridge.backend.model.dto.ExpressionBulkImportRowResult;
import com.deutschbridge.backend.model.dto.ExpressionExampleRequest;
import com.deutschbridge.backend.model.dto.ExpressionManualRequest;
import com.deutschbridge.backend.model.dto.ExpressionPatternRequest;
import com.deutschbridge.backend.model.dto.ExpressionQuestionOptionRequest;
import com.deutschbridge.backend.model.dto.ExpressionQuestionRequest;
import com.deutschbridge.backend.model.dto.ExpressionResponse;
import com.deutschbridge.backend.model.entity.Expression;
import com.deutschbridge.backend.model.entity.ExpressionBookmark;
import com.deutschbridge.backend.model.entity.ExpressionExample;
import com.deutschbridge.backend.model.entity.ExpressionPattern;
import com.deutschbridge.backend.model.entity.ExpressionProgress;
import com.deutschbridge.backend.model.entity.ExpressionQuestion;
import com.deutschbridge.backend.model.entity.ExpressionQuestionOption;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import com.deutschbridge.backend.model.enums.ExpressionType;
import com.deutschbridge.backend.repository.ExpressionBookmarkRepository;
import com.deutschbridge.backend.repository.ExpressionProgressRepository;
import com.deutschbridge.backend.repository.ExpressionRepository;
import com.deutschbridge.backend.util.ExpressionMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ExpressionService {

    private static final String NOT_FOUND_MSG = "Expression not found!";

    private final ExpressionRepository expressionRepository;
    private final ExpressionProgressRepository expressionProgressRepository;
    private final ExpressionBookmarkRepository expressionBookmarkRepository;
    private final UserService userService;
    private final RequestContext requestContext;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    public ExpressionService(ExpressionRepository expressionRepository,
                              ExpressionProgressRepository expressionProgressRepository,
                              ExpressionBookmarkRepository expressionBookmarkRepository,
                              UserService userService,
                              RequestContext requestContext,
                              FileStorageService fileStorageService,
                              ObjectMapper objectMapper) {
        this.expressionRepository = expressionRepository;
        this.expressionProgressRepository = expressionProgressRepository;
        this.expressionBookmarkRepository = expressionBookmarkRepository;
        this.userService = userService;
        this.requestContext = requestContext;
        this.fileStorageService = fileStorageService;
        this.objectMapper = objectMapper;
    }

    // Not cached: the response is scoped to the current user's learning progress, so a shared
    // 'all' cache key would leak one user's progress to every other user reading it.
    public List<ExpressionResponse> findAllPublished(ExpressionType type) {
        List<Expression> expressions = publishedOnly(expressionRepository.findAll()).stream()
                .filter(e -> type == null || e.getType() == type)
                .toList();
        return mapWithCurrentUserProgress(expressions);
    }

    public ExpressionResponse findByIdForStudent(String id) throws DataNotFoundException {
        Expression expression = studentVisibleEntityById(id);
        List<ExpressionResponse> mapped = mapWithCurrentUserProgress(List.of(expression));
        return mapped.get(0);
    }

    /**
     * Records that the current user has read this expression's full detail page - the "recognition"
     * axis of mastery (spec section 6/14/15). Only the first view counts, so re-opening the page
     * doesn't inflate the score; recognition alone can't push mastery past LEARNING (see
     * ExpressionMapper.computeMasteryLevel).
     */
    public ExpressionResponse markViewed(String id) throws DataNotFoundException {
        Expression expression = studentVisibleEntityById(id);

        User user = userService.findByEmail(requestContext.getUserEmail());
        ExpressionProgress progress = expressionProgressRepository.findByUserAndExpression(user, expression)
                .orElseGet(() -> {
                    ExpressionProgress created = new ExpressionProgress();
                    created.setUser(user);
                    created.setExpression(expression);
                    return created;
                });

        if (progress.getRecognitionScore() == 0) {
            progress.setRecognitionScore(50);
            progress.setMasteryLevel(ExpressionMapper.computeMasteryLevel(progress));
            expressionProgressRepository.save(progress);
        }

        boolean bookmarked = expressionBookmarkRepository.existsByUserAndExpression(user, expression);
        return ExpressionMapper.mapToResponse(expression, progress, bookmarked);
    }

    /** Expressions the current user has practiced but is still weak on (overall score below 50). */
    public List<ExpressionResponse> findDifficultForCurrentUser() {
        User user = userService.findByEmail(requestContext.getUserEmail());
        List<ExpressionProgress> difficult = expressionProgressRepository.findByUser(user).stream()
                .filter(p -> ExpressionMapper.overallScore(p) < 50)
                .toList();
        Set<String> bookmarkedIds = bookmarkedExpressionIds(user, difficult.stream().map(ExpressionProgress::getExpression).toList());
        return difficult.stream()
                .map(p -> ExpressionMapper.mapToResponse(p.getExpression(), p, bookmarkedIds.contains(p.getExpression().getId())))
                .toList();
    }

    /** Adds the current user's bookmark on this expression (idempotent - re-bookmarking is a no-op). */
    public ExpressionResponse addBookmark(String id) throws DataNotFoundException {
        Expression expression = studentVisibleEntityById(id);
        User user = userService.findByEmail(requestContext.getUserEmail());
        if (!expressionBookmarkRepository.existsByUserAndExpression(user, expression)) {
            ExpressionBookmark bookmark = new ExpressionBookmark();
            bookmark.setUser(user);
            bookmark.setExpression(expression);
            expressionBookmarkRepository.save(bookmark);
        }
        return mapWithCurrentUserProgress(List.of(expression)).get(0);
    }

    public ExpressionResponse removeBookmark(String id) throws DataNotFoundException {
        Expression expression = studentVisibleEntityById(id);
        User user = userService.findByEmail(requestContext.getUserEmail());
        expressionBookmarkRepository.deleteByUserAndExpression(user, expression);
        return mapWithCurrentUserProgress(List.of(expression)).get(0);
    }

    public List<ExpressionResponse> findAllForAdmin() {
        return expressionRepository.findAll().stream()
                .map(ExpressionMapper::mapToAdminResponse)
                .toList();
    }

    public ExpressionResponse findByIdForAdmin(String id) throws DataNotFoundException {
        return ExpressionMapper.mapToAdminResponse(findEntityById(id));
    }

    public ExpressionResponse createManual(ExpressionManualRequest request) {
        Expression expression = new Expression();
        applyRequest(expression, request);
        return ExpressionMapper.mapToAdminResponse(expressionRepository.save(expression));
    }

    /**
     * Best-effort bulk import: each row is parsed/validated/saved independently, so one bad row
     * (a typo'd enum value, a missing required field, malformed JSON for that entry) doesn't sink
     * the rest of the batch. Rows are plain JsonNode rather than ExpressionManualRequest so a
     * single unparseable row surfaces as one failed row instead of rejecting the whole request at
     * the HTTP deserialization layer.
     */
    public ExpressionBulkImportResult bulkImport(List<JsonNode> rows) {
        List<ExpressionBulkImportRowResult> results = new ArrayList<>();
        int successCount = 0;

        for (int i = 0; i < rows.size(); i++) {
            JsonNode row = rows.get(i);
            String expressionText = row.hasNonNull("expression") ? row.get("expression").asText() : null;
            try {
                ExpressionManualRequest request = objectMapper.treeToValue(row, ExpressionManualRequest.class);
                validateRequiredFields(request);
                Expression expression = new Expression();
                applyRequest(expression, request);
                Expression saved = expressionRepository.save(expression);
                results.add(new ExpressionBulkImportRowResult(i, expressionText, true, null, saved.getId()));
                successCount++;
            } catch (Exception e) {
                results.add(new ExpressionBulkImportRowResult(i, expressionText, false, describeImportError(e), null));
            }
        }

        return new ExpressionBulkImportResult(rows.size(), successCount, rows.size() - successCount, results);
    }

    private void validateRequiredFields(ExpressionManualRequest request) {
        if (request.expression() == null || request.expression().isBlank()) {
            throw new IllegalArgumentException("\"expression\" is required.");
        }
        if (request.type() == null) {
            throw new IllegalArgumentException("\"type\" is required (NOMEN_VERB_VERBINDUNG or REDEWENDUNG).");
        }
        if (request.level() == null) {
            throw new IllegalArgumentException("\"level\" is required (A1, A2, B1, B2, C1, or C2).");
        }
        if (request.meaningDe() == null || request.meaningDe().isBlank()) {
            throw new IllegalArgumentException("\"meaningDe\" is required.");
        }
    }

    private String describeImportError(Exception e) {
        if (e instanceof InvalidFormatException invalidFormat) {
            String field = invalidFormat.getPath().isEmpty() ? "a field" : invalidFormat.getPath().get(0).getFieldName();
            return "Invalid value \"" + invalidFormat.getValue() + "\" for \"" + field + "\".";
        }
        if (e instanceof IllegalArgumentException) {
            return e.getMessage();
        }
        return "Could not import this row: " + e.getMessage();
    }

    public ExpressionResponse updateManual(String id, ExpressionManualRequest request) throws DataNotFoundException {
        Expression existing = findEntityById(id);
        String previousImageUrl = existing.getImageUrl();
        applyRequest(existing, request);
        ExpressionResponse response = ExpressionMapper.mapToAdminResponse(expressionRepository.save(existing));

        // Only once the new value is actually persisted, and only when the request touched imageUrl
        // at all (a partial update like the draft/publish toggle sends no imageUrl and must not
        // wipe the existing illustration file).
        if (request.imageUrl() != null && !request.imageUrl().equals(previousImageUrl)) {
            fileStorageService.deleteFile(previousImageUrl);
        }
        return response;
    }

    public void deleteById(String id) throws DataNotFoundException {
        Expression existing = findEntityById(id);
        fileStorageService.deleteFile(existing.getImageUrl());
        expressionRepository.delete(existing);
    }

    private void applyRequest(Expression expression, ExpressionManualRequest request) {
        if (request.expression() != null) expression.setExpression(request.expression());
        if (request.type() != null) expression.setType(request.type());
        if (request.level() != null) expression.setLevel(request.level());
        if (request.meaningDe() != null) expression.setMeaningDe(request.meaningDe());
        if (request.meaningEn() != null) expression.setMeaningEn(request.meaningEn());
        if (request.meaningFa() != null) expression.setMeaningFa(request.meaningFa());
        if (request.literalMeaning() != null) expression.setLiteralMeaning(request.literalMeaning());
        if (request.figurativeMeaning() != null) expression.setFigurativeMeaning(request.figurativeMeaning());
        if (request.imageUrl() != null) expression.setImageUrl(request.imageUrl());
        if (request.grammarNote() != null) expression.setGrammarNote(request.grammarNote());
        if (request.usageNote() != null) expression.setUsageNote(request.usageNote());
        if (request.register() != null) expression.setRegister(request.register());
        if (request.commonMistakes() != null) expression.setCommonMistakes(request.commonMistakes());
        expression.setStatus(request.status() != null ? request.status() : ExpressionStatus.DRAFT);

        if (request.examples() != null) {
            expression.getExamples().clear();
            for (ExpressionExampleRequest exampleRequest : request.examples()) {
                ExpressionExample example = new ExpressionExample();
                example.setExpression(expression);
                example.setSentence(exampleRequest.sentence());
                example.setTranslationEn(exampleRequest.translationEn());
                example.setTranslationFa(exampleRequest.translationFa());
                example.setContext(exampleRequest.context());
                expression.getExamples().add(example);
            }
        }

        if (request.patterns() != null) {
            expression.getPatterns().clear();
            for (ExpressionPatternRequest patternRequest : request.patterns()) {
                ExpressionPattern pattern = new ExpressionPattern();
                pattern.setExpression(expression);
                pattern.setPattern(patternRequest.pattern());
                pattern.setGrammarCase(patternRequest.grammarCase());
                pattern.setPreposition(patternRequest.preposition());
                pattern.setExample(patternRequest.example());
                expression.getPatterns().add(pattern);
            }
        }

        if (request.questions() != null) {
            expression.getQuestions().clear();
            for (ExpressionQuestionRequest questionRequest : request.questions()) {
                ExpressionQuestion question = new ExpressionQuestion();
                question.setExpression(expression);
                question.setType(questionRequest.type());
                question.setFormat(questionRequest.format());
                question.setPrompt(questionRequest.prompt());
                question.setExplanation(questionRequest.explanation());
                if (questionRequest.options() != null) {
                    for (ExpressionQuestionOptionRequest optionRequest : questionRequest.options()) {
                        ExpressionQuestionOption option = new ExpressionQuestionOption();
                        option.setQuestion(question);
                        option.setText(optionRequest.text());
                        option.setCorrect(optionRequest.correct());
                        question.getOptions().add(option);
                    }
                }
                expression.getQuestions().add(question);
            }
        }
    }

    private Expression findEntityById(String id) throws DataNotFoundException {
        return expressionRepository.findById(id).orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
    }

    private Expression studentVisibleEntityById(String id) throws DataNotFoundException {
        Expression expression = findEntityById(id);
        if (expression.getStatus() == ExpressionStatus.DRAFT) {
            throw new DataNotFoundException(NOT_FOUND_MSG);
        }
        return expression;
    }

    private List<Expression> publishedOnly(List<Expression> expressions) {
        return expressions.stream().filter(e -> e.getStatus() != ExpressionStatus.DRAFT).toList();
    }

    private Set<String> bookmarkedExpressionIds(User user, List<Expression> expressions) {
        if (expressions.isEmpty()) return Set.of();
        return expressionBookmarkRepository.findByUserAndExpressionIn(user, expressions).stream()
                .map(b -> b.getExpression().getId())
                .collect(Collectors.toSet());
    }

    private List<ExpressionResponse> mapWithCurrentUserProgress(List<Expression> expressions) {
        if (expressions.isEmpty()) return List.of();

        User user = userService.findByEmail(requestContext.getUserEmail());
        List<ExpressionProgress> progresses = expressionProgressRepository.findByUserAndExpressionIn(user, expressions);
        Map<String, ExpressionProgress> progressByExpressionId = progresses.stream()
                .collect(Collectors.toMap(p -> p.getExpression().getId(), p -> p, (first, second) -> first));
        Set<String> bookmarkedIds = bookmarkedExpressionIds(user, expressions);

        return expressions.stream()
                .map(e -> ExpressionMapper.mapToResponse(e, progressByExpressionId.get(e.getId()), bookmarkedIds.contains(e.getId())))
                .toList();
    }
}
