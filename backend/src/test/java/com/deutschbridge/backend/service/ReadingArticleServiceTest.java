package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ReadingArticleManualRequest;
import com.deutschbridge.backend.model.dto.ReadingArticlePageResponse;
import com.deutschbridge.backend.model.dto.ReadingArticleSummaryResponse;
import com.deutschbridge.backend.model.entity.LearningProgress;
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
import com.deutschbridge.backend.service.cache.ContentCacheService;
import com.deutschbridge.backend.service.cache.ReadingProgressCacheService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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

    @Mock
    private ContentCacheService contentCacheService;

    @Mock
    private ReadingProgressCacheService readingProgressCacheService;

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
                "Titel", "Thema", LearningLevel.A1, "Inhalt", null, List.of(), List.of(annotation), List.of(question), null
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

        when(contentCacheService.getReadingArticle("article1")).thenReturn(java.util.Optional.of(article));
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

    @Test
    @DisplayName("findByIdWithLearningProgress -> should not touch the view count (counted via recordView)")
    void findByIdWithLearningProgress_shouldNotIncrementViewCount() throws DataNotFoundException {
        User user = createUser();
        ReadingArticle article = new ReadingArticle();
        article.setId("article1");

        when(contentCacheService.getReadingArticle("article1")).thenReturn(java.util.Optional.of(article));
        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(learningProgressRepository.findByUserAndReadingIn(user, List.of(article))).thenReturn(List.of());

        service.findByIdWithLearningProgress("article1");

        verify(readingArticleRepository, never()).save(any());
        verify(readingArticleRepository, never()).incrementViewCount(any());
    }

    @Test
    @DisplayName("findByIdWithLearningProgress -> should throw when the article does not exist")
    void findByIdWithLearningProgress_shouldThrowWhenMissing() {
        when(contentCacheService.getReadingArticle("missing")).thenReturn(java.util.Optional.empty());

        assertThrows(DataNotFoundException.class, () -> service.findByIdWithLearningProgress("missing"));
    }

    // ---------------------------------------------------------------
    // findPageWithLearningProgress
    // ---------------------------------------------------------------
    @Test
    @DisplayName("findPageWithLearningProgress -> should normalize search/paging and merge live learned + new-word state")
    void findPageWithLearningProgress_shouldMergeUserState() {
        User user = createUser();
        ContentCacheService.ReadingArticleListEntry learnedEntry = new ContentCacheService.ReadingArticleListEntry(
                "a1", "Haus", "Wohnen", LearningLevel.A1, null, 3, null, List.of("Haus", "Garten"));
        ContentCacheService.ReadingArticleListEntry otherEntry = new ContentCacheService.ReadingArticleListEntry(
                "a2", "Schule", "Bildung", LearningLevel.A1, null, 0, null, List.of());

        when(contentCacheService.getReadingArticleListPage(LearningLevel.A1, "haus", 0, 50))
                .thenReturn(new ContentCacheService.ReadingArticleListPage(List.of(learnedEntry, otherEntry), 2, 1));
        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);

        ReadingArticle a1 = new ReadingArticle();
        a1.setId("a1");
        LearningProgress progress = new LearningProgress();
        progress.setReading(a1);
        progress.setIsLearned(true);
        when(learningProgressRepository.findByUserAndReadingIdIn(user, List.of("a1", "a2"))).thenReturn(List.of(progress));

        UserWordProgress knownProgress = new UserWordProgress();
        knownProgress.setLemma("Haus");
        knownProgress.setStatus(WordProgressStatus.KNOWN);
        when(userWordProgressRepository.findByUserAndLemmaIn(user, List.of("Haus", "Garten"))).thenReturn(List.of(knownProgress));

        ReadingArticlePageResponse response = service.findPageWithLearningProgress(LearningLevel.A1, "  HAUS ", -3, 500);

        assertEquals(0, response.page());
        assertEquals(50, response.size());
        assertEquals(2, response.totalElements());
        ReadingArticleSummaryResponse first = response.items().get(0);
        assertTrue(first.learned());
        assertEquals(1, first.newWordCount());
        assertEquals("A1", first.level());
        assertFalse(response.items().get(1).learned());
    }

    @Test
    @DisplayName("findPageWithLearningProgress -> should skip user lookups for an empty page")
    void findPageWithLearningProgress_shouldSkipUserLookupsWhenEmpty() {
        when(contentCacheService.getReadingArticleListPage(LearningLevel.B2, "", 0, 8))
                .thenReturn(new ContentCacheService.ReadingArticleListPage(List.of(), 0, 0));

        ReadingArticlePageResponse response = service.findPageWithLearningProgress(LearningLevel.B2, null, 0, 8);

        assertTrue(response.items().isEmpty());
        verify(userService, never()).findByEmail(any());
    }

    // ---------------------------------------------------------------
    // recordView
    // ---------------------------------------------------------------
    @Test
    @DisplayName("recordView -> should increment atomically and return the new count")
    void recordView_shouldIncrementAndReturnCount() throws DataNotFoundException {
        when(readingArticleRepository.incrementViewCount("article1")).thenReturn(1);
        when(readingArticleRepository.findViewCountById("article1")).thenReturn(java.util.Optional.of(7L));

        assertEquals(7L, service.recordView("article1").viewCount());
    }

    @Test
    @DisplayName("recordView -> should throw when the article does not exist")
    void recordView_shouldThrowWhenMissing() {
        when(readingArticleRepository.incrementViewCount("missing")).thenReturn(0);

        assertThrows(DataNotFoundException.class, () -> service.recordView("missing"));
    }
}
