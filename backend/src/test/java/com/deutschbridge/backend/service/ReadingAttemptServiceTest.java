package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AnswerFeedbackResponse;
import com.deutschbridge.backend.model.dto.AttemptResultResponse;
import com.deutschbridge.backend.model.dto.CompleteAttemptRequest;
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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReadingAttemptServiceTest {

    @Mock
    private UserArticleAttemptRepository attemptRepository;

    @Mock
    private UserWordProgressRepository wordProgressRepository;

    @Mock
    private ReadingArticleRepository readingArticleRepository;

    @Mock
    private ReadingArticleService readingArticleService;

    @Mock
    private UserService userService;

    @Mock
    private RequestContext requestContext;

    @InjectMocks
    private ReadingAttemptService service;

    private User createUser() {
        User user = new User();
        user.setId("u1");
        user.setEmail("test@mail.com");
        return user;
    }

    private ReadingQuizQuestion hauptidee() {
        ReadingQuizQuestion q = new ReadingQuizQuestion();
        q.setId("q1");
        q.setType(ReadingQuizQuestionType.HAUPTIDEE);
        q.setPrompt("Worum geht es im Text?");
        q.setOptions(List.of("A", "B", "C"));
        q.setCorrectAnswer("A");
        q.setExplanation("Weil...");
        q.setSupportingSentence("Der Text handelt von A.");
        q.setMinLevel(LearningLevel.A1);
        return q;
    }

    private ReadingQuizQuestion detail(String id) {
        ReadingQuizQuestion q = new ReadingQuizQuestion();
        q.setId(id);
        q.setType(ReadingQuizQuestionType.DETAIL);
        q.setPrompt("Welches Detail stimmt?");
        q.setOptions(List.of("A", "B", "C"));
        q.setCorrectAnswer("A");
        q.setExplanation("Weil...");
        q.setSupportingSentence("Detailsatz.");
        q.setMinLevel(LearningLevel.A1);
        return q;
    }

    private ReadingQuizQuestion vocabContext(String relatedAnnotationId) {
        ReadingQuizQuestion q = new ReadingQuizQuestion();
        q.setId("q2");
        q.setType(ReadingQuizQuestionType.VOCAB_CONTEXT);
        q.setPrompt("Was bedeutet 'Kritik üben'?");
        q.setOptions(List.of("to criticize", "to exercise", "to practice"));
        q.setCorrectAnswer("to criticize");
        q.setExplanation("Kritik üben bedeutet kritisieren.");
        q.setSupportingSentence("Er übte Kritik an dem Vorschlag.");
        q.setMinLevel(LearningLevel.A1);
        q.setRelatedAnnotationId(relatedAnnotationId);
        return q;
    }

    private ReadingArticle articleWithQuiz(List<ReadingQuizQuestion> quiz, List<Annotation> annotations) {
        ReadingArticle article = new ReadingArticle();
        article.setId("article1");
        article.setLevel(LearningLevel.A2);
        article.setQuiz(quiz);
        article.setAnnotations(annotations);
        return article;
    }

    // ---------------------------------------------------------------
    // start
    // ---------------------------------------------------------------
    @Test
    @DisplayName("start -> should create an attempt and return questions without answers")
    void start_shouldCreateAttemptAndReturnPublicQuestions() throws DataNotFoundException {
        User user = createUser();
        ReadingArticle article = articleWithQuiz(List.of(hauptidee()), List.of());

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(readingArticleService.findById("article1")).thenReturn(article);
        when(attemptRepository.save(any())).thenAnswer(inv -> {
            UserArticleAttempt attempt = inv.getArgument(0);
            attempt.setId("attempt1");
            return attempt;
        });

        StartAttemptResponse response = service.start("article1");

        assertEquals("attempt1", response.attemptId());
        assertEquals(1, response.questions().size());
        assertEquals("q1", response.questions().get(0).id());
        verify(attemptRepository).save(argThat(a -> a.getUser().equals(user) && a.getArticle().equals(article)));
    }

    // ---------------------------------------------------------------
    // submitAnswer
    // ---------------------------------------------------------------
    @Test
    @DisplayName("submitAnswer -> should grade a correct answer without leaking a suggestion")
    void submitAnswer_shouldGradeCorrectAnswer() throws DataNotFoundException {
        ReadingArticle article = articleWithQuiz(List.of(hauptidee()), List.of());
        UserArticleAttempt attempt = new UserArticleAttempt();
        attempt.setId("attempt1");
        attempt.setArticle(article);
        attempt.setAnswers(new ArrayList<>());

        when(attemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));

        AnswerFeedbackResponse feedback = service.submitAnswer("attempt1", new SubmitAnswerRequest("q1", "A"));

        assertTrue(feedback.correct());
        assertEquals("A", feedback.correctAnswer());
        assertNull(feedback.relatedLemma());
        assertEquals(1, attempt.getAnswers().size());
        assertTrue(attempt.getAnswers().get(0).isCorrect());
        verify(attemptRepository).save(attempt);
    }

    @Test
    @DisplayName("submitAnswer -> on a wrong VOCAB_CONTEXT answer should suggest the related lemma and record the miss")
    void submitAnswer_shouldSuggestLexiconOnWrongVocabAnswer() throws DataNotFoundException {
        Annotation annotation = new Annotation();
        annotation.setId("ann1");
        annotation.setLemma("Kritik üben");

        ReadingArticle article = articleWithQuiz(List.of(vocabContext("ann1")), List.of(annotation));
        UserArticleAttempt attempt = new UserArticleAttempt();
        attempt.setId("attempt1");
        attempt.setArticle(article);
        attempt.setUser(createUser());
        attempt.setAnswers(new ArrayList<>());

        UserWordProgress existingProgress = new UserWordProgress();
        existingProgress.setLemma("Kritik üben");

        when(attemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));
        when(wordProgressRepository.findByUserAndLemma(attempt.getUser(), "Kritik üben"))
                .thenReturn(Optional.of(existingProgress));

        AnswerFeedbackResponse feedback = service.submitAnswer("attempt1", new SubmitAnswerRequest("q2", "to exercise"));

        assertFalse(feedback.correct());
        assertEquals("Kritik üben", feedback.relatedLemma());
        assertEquals(1, existingProgress.getTimesIncorrectInQuiz());
        verify(wordProgressRepository).save(existingProgress);
    }

    // ---------------------------------------------------------------
    // complete
    // ---------------------------------------------------------------
    @Test
    @DisplayName("complete -> should compute comprehension and vocab scores separately")
    void complete_shouldComputeScoresSeparately() throws DataNotFoundException {
        ReadingArticle article = articleWithQuiz(List.of(hauptidee(), vocabContext("ann1")), List.of());
        UserArticleAttempt attempt = new UserArticleAttempt();
        attempt.setId("attempt1");
        attempt.setUser(createUser());
        attempt.setArticle(article);
        attempt.setAnswers(List.of(
                new QuizAnswerRecord("q1", "A", true),
                new QuizAnswerRecord("q2", "to exercise", false)
        ));

        when(attemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));
        when(attemptRepository.save(attempt)).thenReturn(attempt);

        AttemptResultResponse result = service.complete("attempt1",
                new CompleteAttemptRequest(List.of("Kritik üben"), List.of("Kritik üben")));

        assertEquals("attempt1", result.attemptId());
        assertEquals(100.0, result.comprehensionScore());
        assertEquals(0.0, result.vocabScore());
        assertNotNull(attempt.getCompletedAt());
        assertEquals(List.of("Kritik üben"), attempt.getWordsSaved());
    }

    // ---------------------------------------------------------------
    // complete -> adaptive difficulty recommendation (spec section 5)
    // ---------------------------------------------------------------
    @Test
    @DisplayName("complete -> should recommend leveling up after two consecutive high-comprehension attempts")
    void complete_shouldRecommendLevelUpAfterTwoConsecutiveHighScores() throws DataNotFoundException {
        User user = createUser();
        ReadingArticle article = articleWithQuiz(List.of(hauptidee()), List.of());
        UserArticleAttempt attempt = new UserArticleAttempt();
        attempt.setId("attempt1");
        attempt.setUser(user);
        attempt.setArticle(article);
        attempt.setAnswers(List.of(new QuizAnswerRecord("q1", "A", true)));

        UserArticleAttempt priorHighAttempt = new UserArticleAttempt();
        priorHighAttempt.setComprehensionScore(90.0);

        ReadingArticle nextLevelArticle = new ReadingArticle();
        nextLevelArticle.setId("article-b1");
        nextLevelArticle.setTitle("Ein B1 Text");
        nextLevelArticle.setLevel(LearningLevel.B1);

        when(attemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));
        when(attemptRepository.save(attempt)).thenReturn(attempt);
        when(attemptRepository.findTop5ByUserAndArticleLevelAndCompletedAtIsNotNullOrderByCompletedAtDesc(user, LearningLevel.A2))
                .thenReturn(List.of(attempt, priorHighAttempt));
        when(readingArticleRepository.findFirstByLevel(LearningLevel.B1)).thenReturn(Optional.of(nextLevelArticle));

        AttemptResultResponse result = service.complete("attempt1", new CompleteAttemptRequest(List.of(), List.of()));

        assertEquals(100.0, result.comprehensionScore());
        assertEquals("LEVEL_UP", result.recommendation().type());
        assertEquals("article-b1", result.recommendation().suggestedArticleId());
        assertEquals("B1", result.recommendation().suggestedLevel());
    }

    @Test
    @DisplayName("complete -> should recommend the authentic linked article over a generic next-level one")
    void complete_shouldPreferLinkedAuthenticArticleForLevelUp() throws DataNotFoundException {
        User user = createUser();
        ReadingArticle article = articleWithQuiz(List.of(hauptidee()), List.of());
        article.setLinkedGroupId("group-1");
        UserArticleAttempt attempt = new UserArticleAttempt();
        attempt.setId("attempt1");
        attempt.setUser(user);
        attempt.setArticle(article);
        attempt.setAnswers(List.of(new QuizAnswerRecord("q1", "A", true)));

        UserArticleAttempt priorHighAttempt = new UserArticleAttempt();
        priorHighAttempt.setComprehensionScore(95.0);

        ReadingArticle authenticVersion = new ReadingArticle();
        authenticVersion.setId("article-authentic");
        authenticVersion.setTitle("Die Originalgeschichte");
        authenticVersion.setLevel(LearningLevel.C1);
        authenticVersion.setLinkedGroupId("group-1");

        when(attemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));
        when(attemptRepository.save(attempt)).thenReturn(attempt);
        when(attemptRepository.findTop5ByUserAndArticleLevelAndCompletedAtIsNotNullOrderByCompletedAtDesc(user, LearningLevel.A2))
                .thenReturn(List.of(attempt, priorHighAttempt));
        when(readingArticleRepository.findByLinkedGroupId("group-1")).thenReturn(List.of(article, authenticVersion));

        AttemptResultResponse result = service.complete("attempt1", new CompleteAttemptRequest(List.of(), List.of()));

        assertEquals("LEVEL_UP", result.recommendation().type());
        assertEquals("article-authentic", result.recommendation().suggestedArticleId());
        assertEquals("C1", result.recommendation().suggestedLevel());
        verify(readingArticleRepository, never()).findFirstByLevel(any());
    }

    @Test
    @DisplayName("complete -> should recommend an easier same-topic article after a low score")
    void complete_shouldRecommendEasierArticleAfterLowScore() throws DataNotFoundException {
        User user = createUser();
        ReadingArticle article = articleWithQuiz(List.of(hauptidee()), List.of());
        article.setTopic("travel");
        UserArticleAttempt attempt = new UserArticleAttempt();
        attempt.setId("attempt1");
        attempt.setUser(user);
        attempt.setArticle(article);
        attempt.setAnswers(List.of(new QuizAnswerRecord("q1", "wrong", false)));

        ReadingArticle easierArticle = new ReadingArticle();
        easierArticle.setId("article-a1");
        easierArticle.setTitle("Reisen - leicht");
        easierArticle.setLevel(LearningLevel.A1);
        easierArticle.setTopic("travel");

        when(attemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));
        when(attemptRepository.save(attempt)).thenReturn(attempt);
        when(readingArticleRepository.findFirstByLevelAndTopicIgnoreCase(LearningLevel.A1, "travel"))
                .thenReturn(Optional.of(easierArticle));

        AttemptResultResponse result = service.complete("attempt1", new CompleteAttemptRequest(List.of(), List.of()));

        assertEquals(0.0, result.comprehensionScore());
        assertEquals("EASIER", result.recommendation().type());
        assertEquals("article-a1", result.recommendation().suggestedArticleId());
        assertEquals("A1", result.recommendation().suggestedLevel());
    }

    @Test
    @DisplayName("complete -> should recommend continuing at the same level for a middling score")
    void complete_shouldContinueForMiddlingScore() throws DataNotFoundException {
        User user = createUser();
        ReadingArticle article = articleWithQuiz(List.of(hauptidee(), detail("q3"), detail("q4")), List.of());
        UserArticleAttempt attempt = new UserArticleAttempt();
        attempt.setId("attempt1");
        attempt.setUser(user);
        attempt.setArticle(article);
        attempt.setAnswers(List.of(
                new QuizAnswerRecord("q1", "A", true),
                new QuizAnswerRecord("q3", "A", true),
                new QuizAnswerRecord("q4", "B", false)
        ));

        when(attemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));
        when(attemptRepository.save(attempt)).thenReturn(attempt);

        AttemptResultResponse result = service.complete("attempt1", new CompleteAttemptRequest(List.of(), List.of()));

        assertEquals(66.66666666666667, result.comprehensionScore(), 0.0001);
        assertEquals("CONTINUE", result.recommendation().type());
        assertEquals("A2", result.recommendation().suggestedLevel());
    }
}
