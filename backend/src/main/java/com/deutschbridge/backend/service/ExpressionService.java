package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExpressionExampleRequest;
import com.deutschbridge.backend.model.dto.ExpressionManualRequest;
import com.deutschbridge.backend.model.dto.ExpressionPatternRequest;
import com.deutschbridge.backend.model.dto.ExpressionQuestionOptionRequest;
import com.deutschbridge.backend.model.dto.ExpressionQuestionRequest;
import com.deutschbridge.backend.model.dto.ExpressionResponse;
import com.deutschbridge.backend.model.entity.Expression;
import com.deutschbridge.backend.model.entity.ExpressionExample;
import com.deutschbridge.backend.model.entity.ExpressionPattern;
import com.deutschbridge.backend.model.entity.ExpressionProgress;
import com.deutschbridge.backend.model.entity.ExpressionQuestion;
import com.deutschbridge.backend.model.entity.ExpressionQuestionOption;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import com.deutschbridge.backend.model.enums.ExpressionType;
import com.deutschbridge.backend.repository.ExpressionProgressRepository;
import com.deutschbridge.backend.repository.ExpressionRepository;
import com.deutschbridge.backend.util.ExpressionMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExpressionService {

    private static final String NOT_FOUND_MSG = "Expression not found!";

    private final ExpressionRepository expressionRepository;
    private final ExpressionProgressRepository expressionProgressRepository;
    private final UserService userService;
    private final RequestContext requestContext;

    public ExpressionService(ExpressionRepository expressionRepository,
                              ExpressionProgressRepository expressionProgressRepository,
                              UserService userService,
                              RequestContext requestContext) {
        this.expressionRepository = expressionRepository;
        this.expressionProgressRepository = expressionProgressRepository;
        this.userService = userService;
        this.requestContext = requestContext;
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
        Expression expression = expressionRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        if (expression.getStatus() == ExpressionStatus.DRAFT) {
            throw new DataNotFoundException(NOT_FOUND_MSG);
        }
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
        Expression expression = expressionRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        if (expression.getStatus() == ExpressionStatus.DRAFT) {
            throw new DataNotFoundException(NOT_FOUND_MSG);
        }

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

        return ExpressionMapper.mapToResponse(expression, progress);
    }

    /** Expressions the current user has practiced but is still weak on (overall score below 50). */
    public List<ExpressionResponse> findDifficultForCurrentUser() {
        User user = userService.findByEmail(requestContext.getUserEmail());
        return expressionProgressRepository.findByUser(user).stream()
                .filter(p -> ExpressionMapper.overallScore(p) < 50)
                .map(p -> ExpressionMapper.mapToResponse(p.getExpression(), p))
                .toList();
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

    public ExpressionResponse updateManual(String id, ExpressionManualRequest request) throws DataNotFoundException {
        Expression existing = findEntityById(id);
        applyRequest(existing, request);
        return ExpressionMapper.mapToAdminResponse(expressionRepository.save(existing));
    }

    public void deleteById(String id) throws DataNotFoundException {
        Expression existing = findEntityById(id);
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

    private List<Expression> publishedOnly(List<Expression> expressions) {
        return expressions.stream().filter(e -> e.getStatus() != ExpressionStatus.DRAFT).toList();
    }

    private List<ExpressionResponse> mapWithCurrentUserProgress(List<Expression> expressions) {
        if (expressions.isEmpty()) return List.of();

        User user = userService.findByEmail(requestContext.getUserEmail());
        List<ExpressionProgress> progresses = expressionProgressRepository.findByUserAndExpressionIn(user, expressions);
        Map<String, ExpressionProgress> progressByExpressionId = progresses.stream()
                .collect(Collectors.toMap(p -> p.getExpression().getId(), p -> p, (first, second) -> first));

        return expressions.stream()
                .map(e -> ExpressionMapper.mapToResponse(e, progressByExpressionId.get(e.getId())))
                .toList();
    }
}
