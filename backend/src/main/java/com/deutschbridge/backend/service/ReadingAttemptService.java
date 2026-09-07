package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AnswerFeedbackResponse;
import com.deutschbridge.backend.model.dto.ArticleRecommendation;
import com.deutschbridge.backend.model.dto.AttemptResultResponse;
import com.deutschbridge.backend.model.dto.CompleteAttemptRequest;
import com.deutschbridge.backend.model.dto.QuizQuestionPublic;
import com.deutschbridge.backend.model.dto.StartAttemptResponse;
import com.deutschbridge.backend.model.dto.SubmitAnswerRequest;
import com.deutschbridge.backend.model.entity.Annotation;
import com.deutschbridge.backend.model.entity.QuizAnswerRecord;
import com.deutschbridge.backend.model.entity.ReadingArticle;
import com.deutschbridge.backend.model.entity.ReadingQuizQuestion;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserArticleAttempt;
import com.deutschbridge.backend.model.entity.UserWordProgress;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.ReadingQuizQuestionType;
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import com.deutschbridge.backend.repository.UserArticleAttemptRepository;
import com.deutschbridge.backend.repository.UserWordProgressRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Runs the reading comprehension + vocab-in-context quiz (spec section 4) and records the
 * resulting UserArticleAttempt (spec 1.4). Feedback is given per-question, immediately -
 * not batched to the end - so the article's stored quiz questions are the source of truth
 * for grading rather than trusting the client's own copy of the correct answer.
 */
@Service
public class ReadingAttemptService {

    private static final String ATTEMPT_NOT_FOUND_MSG = "Reading attempt not found!";
    private static final double LEVEL_UP_THRESHOLD = 85.0;
    private static final double EASIER_THRESHOLD = 60.0;
    private static final int CONSECUTIVE_FOR_LEVEL_UP = 2;

    private final UserArticleAttemptRepository attemptRepository;
    private final UserWordProgressRepository wordProgressRepository;
    private final ReadingArticleRepository readingArticleRepository;
    private final ReadingArticleService readingArticleService;
    private final UserService userService;
    private final RequestContext requestContext;

    public ReadingAttemptService(UserArticleAttemptRepository attemptRepository,
                                  UserWordProgressRepository wordProgressRepository,
                                  ReadingArticleRepository readingArticleRepository,
                                  ReadingArticleService readingArticleService,
                                  UserService userService,
                                  RequestContext requestContext) {
        this.attemptRepository = attemptRepository;
        this.wordProgressRepository = wordProgressRepository;
        this.readingArticleRepository = readingArticleRepository;
        this.readingArticleService = readingArticleService;
        this.userService = userService;
        this.requestContext = requestContext;
    }

    public StartAttemptResponse start(String articleId) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        ReadingArticle article = readingArticleService.findById(articleId);

        UserArticleAttempt attempt = new UserArticleAttempt();
        attempt.setUser(user);
        attempt.setArticle(article);
        attempt = attemptRepository.save(attempt);

        List<ReadingQuizQuestion> quiz = article.getQuiz() != null ? article.getQuiz() : List.of();
        List<QuizQuestionPublic> questions = quiz.stream()
                .filter(q -> article.getLevel() == null || q.getMinLevel() == null
                        || article.getLevel().ordinal() >= q.getMinLevel().ordinal())
                .map(q -> new QuizQuestionPublic(q.getId(), q.getType(), q.getPrompt(), q.getOptions()))
                .toList();

        return new StartAttemptResponse(attempt.getId(), questions);
    }

    public AnswerFeedbackResponse submitAnswer(String attemptId, SubmitAnswerRequest request) throws DataNotFoundException {
        UserArticleAttempt attempt = findAttempt(attemptId);
        ReadingArticle article = attempt.getArticle();

        ReadingQuizQuestion question = (article.getQuiz() != null ? article.getQuiz() : List.<ReadingQuizQuestion>of())
                .stream()
                .filter(q -> q.getId().equals(request.questionId()))
                .findFirst()
                .orElseThrow(() -> new DataNotFoundException("Quiz question not found!"));

        boolean correct = question.getCorrectAnswer() != null
                && question.getCorrectAnswer().trim().equalsIgnoreCase(
                request.answer() != null ? request.answer().trim() : "");

        recordAnswer(attempt, question, request, correct);

        String relatedLemma = null;
        if (question.getType() == ReadingQuizQuestionType.VOCAB_CONTEXT && question.getRelatedAnnotationId() != null) {
            relatedLemma = findAnnotationLemma(article, question.getRelatedAnnotationId());
            bumpQuizStats(attempt.getUser(), relatedLemma, correct);
        }

        attemptRepository.save(attempt);

        return new AnswerFeedbackResponse(
                correct,
                question.getCorrectAnswer(),
                question.getExplanation(),
                question.getSupportingSentence(),
                !correct ? relatedLemma : null
        );
    }

    public AttemptResultResponse complete(String attemptId, CompleteAttemptRequest request) throws DataNotFoundException {
        UserArticleAttempt attempt = findAttempt(attemptId);
        ReadingArticle article = attempt.getArticle();
        List<ReadingQuizQuestion> quiz = article.getQuiz() != null ? article.getQuiz() : List.of();

        double comprehensionScore = scoreFor(attempt, quiz, q -> q.getType() != ReadingQuizQuestionType.VOCAB_CONTEXT);
        double vocabScore = scoreFor(attempt, quiz, q -> q.getType() == ReadingQuizQuestionType.VOCAB_CONTEXT);

        attempt.setComprehensionScore(comprehensionScore);
        attempt.setVocabScore(vocabScore);
        attempt.setWordsTapped(request.wordsTapped() != null ? request.wordsTapped() : new ArrayList<>());
        attempt.setWordsSaved(request.wordsSaved() != null ? request.wordsSaved() : new ArrayList<>());
        attempt.setCompletedAt(LocalDateTime.now());
        attemptRepository.save(attempt);

        ArticleRecommendation recommendation = buildRecommendation(attempt.getUser(), article, comprehensionScore);

        return new AttemptResultResponse(attempt.getId(), comprehensionScore, vocabScore, recommendation);
    }

    /**
     * Adaptive difficulty loop (spec section 5). vocabScore intentionally never factors in here -
     * it only feeds the spaced-repetition queue, per spec.
     */
    private ArticleRecommendation buildRecommendation(User user, ReadingArticle article, double comprehensionScore) {
        LearningLevel level = article.getLevel();
        if (level == null) {
            return new ArticleRecommendation("CONTINUE", null, null, null, "Keep reading at your own pace.");
        }

        if (comprehensionScore >= LEVEL_UP_THRESHOLD) {
            List<UserArticleAttempt> recent = attemptRepository
                    .findTop5ByUserAndArticleLevelAndCompletedAtIsNotNullOrderByCompletedAtDesc(user, level);
            long consecutiveHigh = recent.stream()
                    .limit(CONSECUTIVE_FOR_LEVEL_UP)
                    .filter(a -> a.getComprehensionScore() != null && a.getComprehensionScore() >= LEVEL_UP_THRESHOLD)
                    .count();
            if (consecutiveHigh >= CONSECUTIVE_FOR_LEVEL_UP) {
                return recommendLevelUp(article, level);
            }
        } else if (comprehensionScore < EASIER_THRESHOLD) {
            return recommendEasier(article, level);
        }

        return new ArticleRecommendation("CONTINUE", null, null, level.getValue(),
                "Solid effort — try another article at this level.");
    }

    private ArticleRecommendation recommendLevelUp(ReadingArticle article, LearningLevel level) {
        if (article.getLinkedGroupId() != null) {
            Optional<ReadingArticle> authentic = readingArticleRepository.findByLinkedGroupId(article.getLinkedGroupId())
                    .stream()
                    .filter(a -> a.getLevel() != null && a.getLevel().ordinal() > level.ordinal())
                    .min(Comparator.comparing(a -> a.getLevel().ordinal()));
            if (authentic.isPresent()) {
                ReadingArticle a = authentic.get();
                return new ArticleRecommendation("LEVEL_UP", a.getId(), a.getTitle(), a.getLevel().getValue(),
                        "Great work at " + level.getValue() + "! Try the authentic version of this story.");
            }
        }

        LearningLevel[] levels = LearningLevel.values();
        if (level.ordinal() + 1 >= levels.length) {
            return new ArticleRecommendation("CONTINUE", null, null, level.getValue(),
                    "Excellent! You've mastered the highest level available.");
        }

        LearningLevel nextLevel = levels[level.ordinal() + 1];
        Optional<ReadingArticle> next = readingArticleRepository.findFirstByLevel(nextLevel);
        if (next.isPresent()) {
            ReadingArticle a = next.get();
            return new ArticleRecommendation("LEVEL_UP", a.getId(), a.getTitle(), nextLevel.getValue(),
                    "Two strong scores at " + level.getValue() + " in a row — ready for " + nextLevel.getValue() + "!");
        }
        return new ArticleRecommendation("LEVEL_UP", null, null, nextLevel.getValue(),
                "You're ready for " + nextLevel.getValue() + " — no articles there yet, check back soon.");
    }

    private ArticleRecommendation recommendEasier(ReadingArticle article, LearningLevel level) {
        if (level.ordinal() == 0) {
            return new ArticleRecommendation("CONTINUE", null, null, level.getValue(),
                    "This is the easiest level available — keep practicing, it'll click!");
        }

        LearningLevel lowerLevel = LearningLevel.values()[level.ordinal() - 1];
        Optional<ReadingArticle> sameTopic = article.getTopic() != null
                ? readingArticleRepository.findFirstByLevelAndTopicIgnoreCase(lowerLevel, article.getTopic())
                : Optional.empty();
        Optional<ReadingArticle> suggestion = sameTopic.isPresent()
                ? sameTopic
                : readingArticleRepository.findFirstByLevel(lowerLevel);

        if (suggestion.isPresent()) {
            ReadingArticle a = suggestion.get();
            return new ArticleRecommendation("EASIER", a.getId(), a.getTitle(), lowerLevel.getValue(),
                    "That was tough — try this easier one" + (sameTopic.isPresent() ? " on the same topic." : "."));
        }
        return new ArticleRecommendation("EASIER", null, null, lowerLevel.getValue(),
                "That was tough — try an easier article at " + lowerLevel.getValue() + ".");
    }

    private UserArticleAttempt findAttempt(String attemptId) throws DataNotFoundException {
        return attemptRepository.findById(attemptId)
                .orElseThrow(() -> new DataNotFoundException(ATTEMPT_NOT_FOUND_MSG));
    }

    private void recordAnswer(UserArticleAttempt attempt, ReadingQuizQuestion question, SubmitAnswerRequest request, boolean correct) {
        List<QuizAnswerRecord> answers = attempt.getAnswers() != null ? attempt.getAnswers() : new ArrayList<>();
        answers.removeIf(a -> a.getQuestionId().equals(question.getId()));
        answers.add(new QuizAnswerRecord(question.getId(), request.answer(), correct));
        attempt.setAnswers(answers);
    }

    private String findAnnotationLemma(ReadingArticle article, String annotationId) {
        return (article.getAnnotations() != null ? article.getAnnotations() : List.<Annotation>of()).stream()
                .filter(a -> annotationId.equals(a.getId()))
                .map(Annotation::getLemma)
                .findFirst()
                .orElse(null);
    }

    private void bumpQuizStats(User user, String lemma, boolean correct) {
        if (lemma == null) return;
        Optional<UserWordProgress> existing = wordProgressRepository.findByUserAndLemma(user, lemma);
        existing.ifPresent(progress -> {
            if (correct) {
                progress.setTimesCorrectInQuiz(progress.getTimesCorrectInQuiz() + 1);
            } else {
                progress.setTimesIncorrectInQuiz(progress.getTimesIncorrectInQuiz() + 1);
            }
            wordProgressRepository.save(progress);
        });
    }

    private double scoreFor(UserArticleAttempt attempt, List<ReadingQuizQuestion> quiz, java.util.function.Predicate<ReadingQuizQuestion> filter) {
        List<String> relevantQuestionIds = quiz.stream().filter(filter).map(ReadingQuizQuestion::getId).toList();
        if (relevantQuestionIds.isEmpty()) return 0.0;

        List<QuizAnswerRecord> answers = attempt.getAnswers() != null ? attempt.getAnswers() : List.of();
        long correctCount = answers.stream()
                .filter(a -> relevantQuestionIds.contains(a.getQuestionId()) && a.isCorrect())
                .count();

        return (correctCount * 100.0) / relevantQuestionIds.size();
    }
}
