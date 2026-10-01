package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.RedemittelAnswerRequest;
import com.deutschbridge.backend.model.dto.RedemittelAnswerResponse;
import com.deutschbridge.backend.model.dto.RedemittelExerciseDto;
import com.deutschbridge.backend.model.dto.RedemittelSessionResponse;
import com.deutschbridge.backend.model.entity.RedemittelCollectionItem;
import com.deutschbridge.backend.model.entity.RedemittelExercise;
import com.deutschbridge.backend.model.entity.RedemittelProgress;
import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.*;
import com.deutschbridge.backend.repository.RedemittelCollectionRepository;
import com.deutschbridge.backend.repository.RedemittelExerciseRepository;
import com.deutschbridge.backend.repository.RedemittelProgressRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RedemittelPracticeServiceTest {

    @Mock private WritingPhraseRepository phraseRepository;
    @Mock private RedemittelProgressRepository progressRepository;
    @Mock private RedemittelCollectionRepository collectionRepository;
    @Mock private RedemittelExerciseRepository exerciseRepository;
    @Mock private LearningActivityService learningActivityService;
    @Mock private RequestContext requestContext;

    private RedemittelPracticeService service;
    private List<WritingPhrase> phrases;
    private List<RedemittelExercise> exercises;

    @BeforeEach
    void setUp() {
        service = new RedemittelPracticeService(phraseRepository, progressRepository, collectionRepository, exerciseRepository,
                learningActivityService, requestContext);
        when(requestContext.getUserId()).thenReturn("u1");
        when(requestContext.getLanguage()).thenReturn("EN");
        when(progressRepository.save(any(RedemittelProgress.class))).thenAnswer(inv -> inv.getArgument(0));

        phrases = new ArrayList<>();
        exercises = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            WritingPhrase p = new WritingPhrase();
            p.setId("p" + i);
            p.setLevel(LearningLevel.B1);
            p.setCategory(WritingPhraseCategory.values()[i]);
            p.setPhrase("Ich finde diese Sache wichtig " + i + ", weil …");
            p.setActive(true);
            phrases.add(p);
            // every phrase has one authored exercise per type
            exercises.add(exercise("p" + i, RedemittelExerciseType.MEANING, null, "right", "wrong1\nwrong2"));
            exercises.add(exercise("p" + i, RedemittelExerciseType.FILL_BLANK, "Ich ________ das", "finde", null));
            exercises.add(exercise("p" + i, RedemittelExerciseType.SITUATION, "Du stimmst zu.", "Da stimme ich zu.", "Nein\nVielleicht"));
            exercises.add(exercise("p" + i, RedemittelExerciseType.PRODUCTION, "Ein Thema", null, null));
        }
        when(phraseRepository.findByIdInAndActiveTrue(anyCollection())).thenAnswer(inv -> {
            Collection<String> ids = inv.getArgument(0);
            return phrases.stream().filter(p -> ids.contains(p.getId())).toList();
        });
        when(phraseRepository.findById(anyString())).thenAnswer(inv ->
                phrases.stream().filter(p -> p.getId().equals(inv.getArgument(0))).findFirst());
        when(exerciseRepository.findByPhraseIdIn(anyCollection())).thenAnswer(inv -> {
            Collection<String> ids = inv.getArgument(0);
            return exercises.stream().filter(e -> ids.contains(e.getPhraseId())).toList();
        });
        when(exerciseRepository.findById(anyString())).thenAnswer(inv ->
                exercises.stream().filter(e -> e.getId().equals(inv.getArgument(0))).findFirst());
    }

    private static RedemittelExercise exercise(String phraseId, RedemittelExerciseType type, String prompt, String correct, String wrong) {
        RedemittelExercise e = new RedemittelExercise();
        e.setId("e-" + phraseId + "-" + type);
        e.setPhraseId(phraseId);
        e.setType(type);
        e.setPrompt(prompt);
        e.setCorrectAnswer(correct);
        e.setWrongAnswers(wrong);
        return e;
    }

    private RedemittelProgress progress(String phraseId, int stage, LocalDateTime nextReviewAt) {
        RedemittelProgress p = new RedemittelProgress();
        p.setUserId("u1");
        p.setPhraseId(phraseId);
        p.setStage(stage);
        p.setStatus(RedemittelScheduler.statusForStage(stage));
        p.setNextReviewAt(nextReviewAt);
        return p;
    }

    private static RedemittelAnswerRequest answer(String phraseId, RedemittelExerciseType type, String answer) {
        return new RedemittelAnswerRequest("e-" + phraseId + "-" + type, answer);
    }

    // ---- sessions ----

    @Test
    @DisplayName("allocate -> 30/30/20/20 for ten, progressing from recognition to production")
    void allocateMix() {
        List<RedemittelExerciseType> seq = RedemittelPracticeService.allocate(10);
        assertEquals(10, seq.size());
        assertEquals(3, seq.stream().filter(t -> t == RedemittelExerciseType.MEANING).count());
        assertEquals(3, seq.stream().filter(t -> t == RedemittelExerciseType.FILL_BLANK).count());
        assertEquals(2, seq.stream().filter(t -> t == RedemittelExerciseType.SITUATION).count());
        assertEquals(2, seq.stream().filter(t -> t == RedemittelExerciseType.PRODUCTION).count());
        for (int i = 1; i < seq.size(); i++) {
            assertTrue(seq.get(i).ordinal() >= seq.get(i - 1).ordinal(), "types must not get easier");
        }
    }

    @Test
    @DisplayName("allocate -> always returns exactly the requested count")
    void allocateAnyCount() {
        for (int n = 1; n <= 20; n++) assertEquals(n, RedemittelPracticeService.allocate(n).size());
    }

    @Test
    @DisplayName("reviewSession -> only the due Redemittel, with the authored exercise their stage calls for")
    void reviewSessionByStage() {
        LocalDateTime past = LocalDateTime.now().minusDays(1);
        when(progressRepository.findDue(eq("u1"), any(), any())).thenReturn(List.of(
                progress("p0", 0, past), progress("p1", 1, past), progress("p2", 2, past), progress("p3", 3, past)));
        when(progressRepository.countDue(eq("u1"), any())).thenReturn(4L);

        RedemittelSessionResponse session = service.reviewSession(10);

        assertEquals(4, session.total());
        // recognition may be the authored meaning or the derived function quiz; the tier is what the stage decides
        assertEquals(List.of(RedemittelExerciseType.MEANING, RedemittelExerciseType.FILL_BLANK,
                RedemittelExerciseType.SITUATION, RedemittelExerciseType.PRODUCTION),
                session.exercises().stream().map(e -> e.type().tier()).toList());
    }

    @Test
    @DisplayName("reviewSession -> a Redemittel without authored exercises still gets the derived function quiz")
    void reviewDerivedWithoutAuthored() {
        exercises.removeIf(e -> e.getPhraseId().equals("p1"));
        LocalDateTime past = LocalDateTime.now().minusDays(1);
        when(progressRepository.findDue(eq("u1"), any(), any())).thenReturn(List.of(progress("p1", 0, past)));

        List<RedemittelExerciseDto> result = service.reviewSession(10).exercises();

        assertEquals(1, result.size());
        assertEquals(RedemittelExerciseType.FUNCTION, result.get(0).type());
        assertEquals("auto:FUNCTION", result.get(0).exerciseId());
    }

    @Test
    @DisplayName("reviewSession -> falls back to the nearest tier when the wanted one has nothing for the phrase")
    void reviewFallsBackToNearestTier() {
        // stage 1 wants recall (fill blank / cloze); p0 has no authored fill blank and no example for a cloze
        exercises.removeIf(e -> e.getPhraseId().equals("p0") && e.getType() == RedemittelExerciseType.FILL_BLANK);
        exercises.removeIf(e -> e.getPhraseId().equals("p0") && e.getType() == RedemittelExerciseType.SITUATION);
        exercises.removeIf(e -> e.getPhraseId().equals("p0") && e.getType() == RedemittelExerciseType.PRODUCTION);
        when(progressRepository.findDue(eq("u1"), any(), any())).thenReturn(List.of(progress("p0", 1, LocalDateTime.now().minusDays(1))));

        List<RedemittelExerciseDto> result = service.reviewSession(10).exercises();

        assertEquals(1, result.size());
        assertEquals(RedemittelExerciseType.MEANING, result.get(0).type().tier());
    }

    @Test
    @DisplayName("reviewSession -> nothing due gives an empty session")
    void reviewSessionEmpty() {
        when(progressRepository.findDue(eq("u1"), any(), any())).thenReturn(List.of());
        assertTrue(service.reviewSession(10).exercises().isEmpty());
    }

    @Test
    @DisplayName("practiceSession -> empty when the learner has not learned or saved anything")
    void practiceNothingLearned() {
        when(progressRepository.findByUserIdOrderByLearnedAtDesc(eq("u1"), any())).thenReturn(List.of());
        assertTrue(service.practiceSession(null, 10).exercises().isEmpty());
    }

    @Test
    @DisplayName("practiceSession -> saved expressions that are not learned yet can be practiced too")
    void practiceIncludesSaved() {
        when(progressRepository.findByUserIdOrderByLearnedAtDesc(eq("u1"), any())).thenReturn(List.of());
        RedemittelCollectionItem saved = new RedemittelCollectionItem();
        saved.setUserId("u1");
        saved.setPhraseId("p4");
        when(collectionRepository.findByUserId("u1")).thenReturn(List.of(saved));

        RedemittelSessionResponse session = service.practiceSession(null, 4);

        assertEquals(4, session.exercises().size());
        assertTrue(session.exercises().stream().allMatch(e -> e.phraseId().equals("p4")));
    }

    @Test
    @DisplayName("practiceSession -> a Redemittel without authored exercises is still practiced with derived ones")
    void practiceUsesDerivedWithoutAuthored() {
        exercises.removeIf(e -> e.getPhraseId().equals("p0"));
        when(progressRepository.findByUserIdOrderByLearnedAtDesc(eq("u1"), any())).thenReturn(List.of(progress("p0", 0, null)));

        RedemittelSessionResponse session = service.practiceSession(null, 10);

        assertEquals(10, session.exercises().size());
        // no authored topic means no production exercise; everything else falls back to what can be derived
        assertTrue(session.exercises().stream().allMatch(e -> e.type() == RedemittelExerciseType.FUNCTION));
    }

    @Test
    @DisplayName("practiceSession -> with an example sentence, cloze and word order are offered too")
    void practiceOffersDerivedFromExample() {
        phrases.get(0).setPhrase("Ich bin der Meinung, dass …");
        phrases.get(0).setExample("Ich bin der Meinung, dass Busse billiger sein sollten.");
        exercises.removeIf(e -> true);
        when(progressRepository.findByUserIdOrderByLearnedAtDesc(eq("u1"), any())).thenReturn(List.of(progress("p0", 0, null)));

        List<RedemittelExerciseType> types = new ArrayList<>();
        for (int i = 0; i < 40; i++) service.practiceSession(null, 10).exercises().forEach(e -> types.add(e.type()));

        assertTrue(types.contains(RedemittelExerciseType.CLOZE));
        assertTrue(types.contains(RedemittelExerciseType.WORD_ORDER));
        assertTrue(types.contains(RedemittelExerciseType.FUNCTION));
    }

    @Test
    @DisplayName("practiceSession -> built from the caller's own learned Redemittel, in difficulty order")
    void practiceSessionOrdered() {
        when(progressRepository.findByUserIdOrderByLearnedAtDesc(eq("u1"), any())).thenReturn(List.of(
                progress("p0", 0, null), progress("p1", 0, null), progress("p2", 0, null)));

        RedemittelSessionResponse session = service.practiceSession(null, 10);

        assertEquals(10, session.exercises().size());
        assertEquals(RedemittelExerciseType.MEANING, session.exercises().get(0).type().tier());
        assertEquals(RedemittelExerciseType.PRODUCTION, session.exercises().get(9).type());
        verify(progressRepository, never()).findByUserIdOrderByLearnedAtDesc(eq("u2"), any());
    }

    // ---- review answers ----

    @Test
    @DisplayName("review -> a correct answer on a due Redemittel moves it to the next interval")
    void reviewCorrectAdvances() throws Exception {
        RedemittelProgress p = progress("p0", 0, LocalDateTime.now().minusHours(1));
        when(progressRepository.findByUserIdAndPhraseId("u1", "p0")).thenReturn(Optional.of(p));

        RedemittelAnswerResponse res = service.review("p0", answer("p0", RedemittelExerciseType.MEANING, "right"));

        assertTrue(res.correct());
        assertEquals("right", res.correctAnswer());
        assertEquals(3, res.nextReviewInDays());
        assertEquals(1, p.getStage());
        assertEquals(1, p.getCorrectCount());
        assertTrue(p.getNextReviewAt().isAfter(LocalDateTime.now().plusDays(2)));
        verify(learningActivityService).track("u1", LearningModule.REDEMITTEL, LearningActivityType.REDEMITTEL_REVIEWED, "p0");
    }

    @Test
    @DisplayName("review -> a wrong answer repeats it tomorrow")
    void reviewWrongRepeatsTomorrow() throws Exception {
        RedemittelProgress p = progress("p0", 3, LocalDateTime.now().minusHours(1));
        when(progressRepository.findByUserIdAndPhraseId("u1", "p0")).thenReturn(Optional.of(p));

        RedemittelAnswerResponse res = service.review("p0", answer("p0", RedemittelExerciseType.MEANING, "wrong1"));

        assertFalse(res.correct());
        assertEquals(1, res.nextReviewInDays());
        assertEquals(0, p.getStage());
        assertEquals(1, p.getIncorrectCount());
    }

    @Test
    @DisplayName("review -> answering one that is not due yet leaves the schedule alone")
    void reviewNotDueKeepsSchedule() throws Exception {
        LocalDateTime later = LocalDateTime.now().plusDays(5);
        RedemittelProgress p = progress("p0", 2, later);
        when(progressRepository.findByUserIdAndPhraseId("u1", "p0")).thenReturn(Optional.of(p));

        RedemittelAnswerResponse res = service.review("p0", answer("p0", RedemittelExerciseType.MEANING, "right"));

        assertNull(res.nextReviewAt());
        assertEquals(2, p.getStage());
        assertEquals(later, p.getNextReviewAt());
    }

    @Test
    @DisplayName("review -> passing the last interval masters the Redemittel")
    void reviewMasters() throws Exception {
        RedemittelProgress p = progress("p0", 5, LocalDateTime.now().minusHours(1));
        when(progressRepository.findByUserIdAndPhraseId("u1", "p0")).thenReturn(Optional.of(p));

        RedemittelAnswerResponse res = service.review("p0", answer("p0", RedemittelExerciseType.PRODUCTION, "Ein ganzer eigener Satz."));

        assertEquals(RedemittelStatus.MASTERED, res.status());
        assertNull(res.nextReviewInDays());
        assertTrue(res.attempted());
        assertNotNull(res.modelAnswer());
    }

    @Test
    @DisplayName("review -> needs a started Redemittel of the caller (another user's progress is invisible)")
    void reviewRequiresOwnProgress() {
        when(progressRepository.findByUserIdAndPhraseId("u1", "p0")).thenReturn(Optional.empty());
        assertThrows(DataNotFoundException.class, () -> service.review("p0", answer("p0", RedemittelExerciseType.MEANING, "right")));
        verify(progressRepository, never()).findByUserIdAndPhraseId(eq("u2"), anyString());
    }

    @Test
    @DisplayName("answers -> the derived function quiz is graded by the Redemittel's category, no stored exercise needed")
    void derivedFunctionAnswer() throws Exception {
        when(progressRepository.findByUserIdAndPhraseId("u1", "p0")).thenReturn(Optional.empty());
        String label = phrases.get(0).getCategory().getLabel();
        assertTrue(service.practice("p0", new RedemittelAnswerRequest("auto:FUNCTION", label)).correct());
        RedemittelAnswerResponse wrong = service.practice("p0", new RedemittelAnswerRequest("auto:FUNCTION", "Etwas anderes"));
        assertFalse(wrong.correct());
        assertEquals(label, wrong.correctAnswer());
    }

    @Test
    @DisplayName("answers -> derived cloze and word order are graded against the example sentence")
    void derivedClozeAndWordOrder() throws Exception {
        phrases.get(0).setPhrase("Ich bin der Meinung, dass …");
        phrases.get(0).setExample("Ich bin der Meinung, dass Busse billiger sein sollten.");
        when(progressRepository.findByUserIdAndPhraseId("u1", "p0")).thenReturn(Optional.empty());

        assertTrue(service.practice("p0", new RedemittelAnswerRequest("auto:CLOZE", "ich bin der meinung, dass")).correct());
        assertFalse(service.practice("p0", new RedemittelAnswerRequest("auto:CLOZE", "Ich denke, dass")).correct());
        assertTrue(service.practice("p0", new RedemittelAnswerRequest("auto:WORD_ORDER", "Ich bin der Meinung, dass Busse billiger sein sollten.")).correct());
        assertFalse(service.practice("p0", new RedemittelAnswerRequest("auto:WORD_ORDER", "Busse Ich bin der Meinung, dass billiger sein sollten.")).correct());
    }

    @Test
    @DisplayName("answers -> a derived type the phrase cannot support (no example) is rejected")
    void derivedNeedsExample() {
        assertThrows(DataNotFoundException.class, () -> service.practice("p0", new RedemittelAnswerRequest("auto:WORD_ORDER", "x")));
    }

    @Test
    @DisplayName("answers -> an exercise of another Redemittel cannot be used")
    void exerciseMustBelongToPhrase() {
        when(progressRepository.findByUserIdAndPhraseId("u1", "p0")).thenReturn(Optional.of(progress("p0", 0, LocalDateTime.now())));
        assertThrows(DataNotFoundException.class, () -> service.review("p0", answer("p1", RedemittelExerciseType.MEANING, "right")));
    }

    @Test
    @DisplayName("production -> an empty sentence is rejected instead of counting as an attempt")
    void productionNeedsText() {
        RedemittelProgress p = progress("p0", 3, LocalDateTime.now().minusHours(1));
        when(progressRepository.findByUserIdAndPhraseId("u1", "p0")).thenReturn(Optional.of(p));
        assertThrows(ResponseStatusException.class, () -> service.review("p0", answer("p0", RedemittelExerciseType.PRODUCTION, " ")));
    }

    // ---- practice answers ----

    @Test
    @DisplayName("practice -> updates the counters but never the review schedule")
    void practiceDoesNotReschedule() throws Exception {
        LocalDateTime next = LocalDateTime.now().minusHours(1);
        RedemittelProgress p = progress("p0", 2, next);
        when(progressRepository.findByUserIdAndPhraseId("u1", "p0")).thenReturn(Optional.of(p));

        RedemittelAnswerResponse res = service.practice("p0", answer("p0", RedemittelExerciseType.FILL_BLANK, "Finde"));

        assertTrue(res.correct());
        assertNull(res.nextReviewAt());
        assertEquals(2, p.getStage());
        assertEquals(next, p.getNextReviewAt());
        assertEquals(1, p.getCorrectCount());
        verify(learningActivityService).track("u1", LearningModule.REDEMITTEL, LearningActivityType.REDEMITTEL_PRACTICED, "p0");
    }

    @Test
    @DisplayName("practice -> an expression the learner has not started is graded without creating progress")
    void practiceWithoutProgress() throws Exception {
        when(progressRepository.findByUserIdAndPhraseId("u1", "p0")).thenReturn(Optional.empty());
        RedemittelAnswerResponse res = service.practice("p0", answer("p0", RedemittelExerciseType.MEANING, "right"));
        assertTrue(res.correct());
        assertEquals(RedemittelStatus.NEW, res.status());
        verify(progressRepository, never()).save(any());
    }

    @Test
    @DisplayName("answers -> an exercise id is required")
    void exerciseRequired() {
        assertThrows(ResponseStatusException.class, () -> service.practice("p0", new RedemittelAnswerRequest(null, "x")));
    }
}
