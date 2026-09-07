package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ReadingArticleManualRequest;
import com.deutschbridge.backend.model.dto.ReadingArticleResponse;
import com.deutschbridge.backend.model.entity.Annotation;
import com.deutschbridge.backend.model.entity.ReadingArticle;
import com.deutschbridge.backend.model.entity.ReadingQuizQuestion;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserWordProgress;
import com.deutschbridge.backend.model.enums.AnnotationType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.ReadingQuizQuestionType;
import com.deutschbridge.backend.model.enums.WordProgressStatus;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import com.deutschbridge.backend.repository.UserWordProgressRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReadingArticleServiceTest {

    @Mock
    private ReadingArticleRepository readingArticleRepository;

    @Mock
    private LearningProgressRepository learningProgressRepository;

    @Mock
    private UserWordProgressRepository userWordProgressRepository;

    @Mock
    private UserService userService;

    @Mock
    private RequestContext requestContext;

    @Mock
    private OllamaService ollamaService;

    @Mock
    private TokenizationService tokenizationService;

    @InjectMocks
    private ReadingArticleService service;

    private User createUser() {
        User user = new User();
        user.setId("u1");
        user.setEmail("test@mail.com");
        return user;
    }

    // ---------------------------------------------------------------
    // suggestAnnotations
    // ---------------------------------------------------------------
    @Test
    @DisplayName("suggestAnnotations -> should parse WORD/NVV/REDEWENDUNG lines and locate spans in the content")
    void suggestAnnotations_shouldParseAllTypesAndLocateSpans() {
        String content = "Sie hat eine wichtige Entscheidung getroffen und übte scharfe Kritik an dem Plan.";
        String raw = """
                ANNOTATIONS:
                WORD|Entscheidung|Entscheidung|noun|die|Entscheidungen|decision|A2|Sie hat eine wichtige Entscheidung getroffen.
                NVV|Entscheidung getroffen|eine Entscheidung treffen|-|-|-|to make a decision|A2|Sie hat eine wichtige Entscheidung getroffen.
                REDEWENDUNG|Kritik üben|Kritik üben|-|-|-|to criticize|to exercise criticism|B1|Sie übte scharfe Kritik an dem Plan.
                """;

        when(ollamaService.generateAnnotations(content, LearningLevel.A2)).thenReturn(raw);

        List<Annotation> annotations = service.suggestAnnotations(content, LearningLevel.A2);

        assertEquals(3, annotations.size());

        Annotation word = annotations.get(0);
        assertEquals(AnnotationType.WORD, word.getType());
        assertEquals("die", word.getGender());
        assertEquals("Entscheidungen", word.getPluralForm());
        assertEquals(LearningLevel.A2, word.getCefrLevel());
        assertNotNull(word.getId());
        assertEquals(1, word.getSpans().size());
        assertEquals(content.indexOf("Entscheidung"), word.getSpans().get(0).getStart());

        Annotation nvv = annotations.get(1);
        assertEquals(AnnotationType.NOMEN_VERB_VERBINDUNG, nvv.getType());
        assertEquals("eine Entscheidung treffen", nvv.getLemma());
        assertFalse(nvv.getSpans().isEmpty());

        Annotation redewendung = annotations.get(2);
        assertEquals(AnnotationType.REDEWENDUNG, redewendung.getType());
        assertEquals("to exercise criticism", redewendung.getLiteralTranslation());
        assertEquals(LearningLevel.B1, redewendung.getCefrLevel());
    }

    // ---------------------------------------------------------------
    // generateQuiz
    // ---------------------------------------------------------------
    @Test
    @DisplayName("generateQuiz -> should link VOCAB_CONTEXT questions back to the matching annotation by lemma")
    void generateQuiz_shouldLinkVocabContextToAnnotation() {
        String content = "Text content";
        Annotation annotation = new Annotation();
        annotation.setId("ann-1");
        annotation.setLemma("Kritik üben");

        String raw = """
                QUIZ:
                HAUPTIDEE|Worum geht es?|A;B;C|A|Erklaerung|Stuetzsatz
                VOCAB_CONTEXT|Was bedeutet 'Kritik üben'?|to criticize;to exercise;to practice|to criticize|Erklaerung|Stuetzsatz|Kritik üben
                """;

        when(ollamaService.generateReadingQuiz(content, LearningLevel.B1)).thenReturn(raw);

        List<ReadingQuizQuestion> quiz = service.generateQuiz(content, LearningLevel.B1, List.of(annotation));

        assertEquals(2, quiz.size());
        assertEquals(LearningLevel.A1, quiz.get(0).getMinLevel());

        ReadingQuizQuestion vocabQuestion = quiz.get(1);
        assertEquals(ReadingQuizQuestionType.VOCAB_CONTEXT, vocabQuestion.getType());
        assertEquals("ann-1", vocabQuestion.getRelatedAnnotationId());
        assertNotNull(vocabQuestion.getId());
    }

    // ---------------------------------------------------------------
    // createManual
    // ---------------------------------------------------------------
    @Test
    @DisplayName("createManual -> should assign ids to submitted annotations and quiz questions")
    void createManual_shouldAssignIdsToAnnotationsAndQuiz() {
        Annotation annotation = new Annotation();
        annotation.setType(AnnotationType.WORD);
        annotation.setLemma("Haus");

        ReadingQuizQuestion question = new ReadingQuizQuestion();
        question.setType(ReadingQuizQuestionType.DETAIL);
        question.setPrompt("Frage");

        ReadingArticleManualRequest request = new ReadingArticleManualRequest(
                "Titel", "Thema", LearningLevel.A1, "Inhalt", List.of(), List.of(annotation), List.of(question), null
        );

        when(readingArticleRepository.save(org.mockito.ArgumentMatchers.any(ReadingArticle.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ReadingArticleResponse response = service.createManual(request);

        assertNotNull(annotation.getId());
        assertNotNull(question.getId());
        assertEquals("Titel", response.title());
    }

    // ---------------------------------------------------------------
    // findByIdWithLearningProgress
    // ---------------------------------------------------------------
    @Test
    @DisplayName("findByIdWithLearningProgress -> should mark KNOWN lemmas and exclude them from the new-word count")
    void findByIdWithLearningProgress_shouldComputeKnownAndNewWordCount() throws DataNotFoundException {
        User user = createUser();

        Annotation known = new Annotation();
        known.setId("a1");
        known.setLemma("Haus");
        Annotation unknown = new Annotation();
        unknown.setId("a2");
        unknown.setLemma("Garten");

        ReadingArticle article = new ReadingArticle();
        article.setId("article1");
        article.setAnnotations(List.of(known, unknown));

        UserWordProgress knownProgress = new UserWordProgress();
        knownProgress.setLemma("Haus");
        knownProgress.setStatus(WordProgressStatus.KNOWN);

        when(readingArticleRepository.findById("article1")).thenReturn(java.util.Optional.of(article));
        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(learningProgressRepository.findByUserAndReadingIn(user, List.of(article))).thenReturn(List.of());
        when(userWordProgressRepository.findByUserAndLemmaIn(user, List.of("Haus", "Garten")))
                .thenReturn(List.of(knownProgress));

        ReadingArticleResponse response = service.findByIdWithLearningProgress("article1");

        assertEquals(1, response.newWordCount());
        assertTrue(response.annotations().stream().anyMatch(a -> a.lemma().equals("Haus") && a.known()));
        assertTrue(response.annotations().stream().anyMatch(a -> a.lemma().equals("Garten") && !a.known()));
    }
}
