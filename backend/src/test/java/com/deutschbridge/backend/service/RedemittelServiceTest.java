package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.RedemittelDto;
import com.deutschbridge.backend.model.dto.RedemittelHubResponse;
import com.deutschbridge.backend.model.entity.RedemittelCollectionItem;
import com.deutschbridge.backend.model.entity.RedemittelProgress;
import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.*;
import com.deutschbridge.backend.repository.RedemittelCollectionRepository;
import com.deutschbridge.backend.repository.RedemittelProgressRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.deutschbridge.backend.service.cache.RedemittelCacheService;
import com.deutschbridge.backend.RedemittelTestFunctions;
import com.deutschbridge.backend.repository.RedemittelFunctionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RedemittelServiceTest {

    @Mock private WritingPhraseRepository phraseRepository;
    @Mock private RedemittelFunctionRepository functionRepository;
    @Mock private RedemittelProgressRepository progressRepository;
    @Mock private RedemittelCollectionRepository collectionRepository;
    @Mock private AppSettingService appSettingService;
    @Mock private UserService userService;
    @Mock private LearningActivityService learningActivityService;
    @Mock private RequestContext requestContext;

    private RedemittelService service;

    @BeforeEach
    void setUp() {
        service = new RedemittelService(phraseRepository, progressRepository, collectionRepository,
                appSettingService, userService, learningActivityService, requestContext,
                new RedemittelCacheService(phraseRepository, org.mockito.Mockito.mock(com.deutschbridge.backend.repository.RedemittelExerciseRepository.class), functionRepository));
        when(requestContext.getUserId()).thenReturn("u1");
        when(requestContext.getUserEmail()).thenReturn("u1@example.com");
        when(requestContext.getLanguage()).thenReturn("EN");
        when(userService.getLearningLevel("u1@example.com")).thenReturn("B1");
        when(appSettingService.getInt(RedemittelService.DAILY_NEW_KEY, 3)).thenReturn(3);
        when(progressRepository.save(any(RedemittelProgress.class))).thenAnswer(inv -> inv.getArgument(0));
        when(collectionRepository.save(any(RedemittelCollectionItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(progressRepository.findByUserIdAndPhraseIdIn(anyString(), anyCollection())).thenReturn(List.of());
        when(collectionRepository.findByUserIdAndPhraseIdIn(anyString(), anyCollection())).thenReturn(List.of());
        when(collectionRepository.findByUserId(anyString())).thenReturn(List.of());
    }

    private WritingPhrase phrase(String id, LearningLevel level, int order) {
        WritingPhrase p = new WritingPhrase();
        p.setId(id);
        p.setLevel(level);
        p.setCategory(RedemittelTestFunctions.of("OPINION"));
        p.setPhrase("Phrase " + id);
        p.setSortOrder(order);
        p.setActive(true);
        return p;
    }

    // ---- today ----

    @Test
    @DisplayName("today -> the daily target, nearest to the learner's level first")
    void todayPrefersLearnerLevel() {
        when(progressRepository.countByUserIdAndLearnedAtAfter(eq("u1"), any())).thenReturn(0L);
        when(phraseRepository.findUnlearned("u1")).thenReturn(List.of(
                phrase("c1", LearningLevel.C1, 0), phrase("a2", LearningLevel.A2, 0), phrase("b1a", LearningLevel.B1, 0),
                phrase("b2", LearningLevel.B2, 0), phrase("b1b", LearningLevel.B1, 1)));

        List<String> ids = service.today().stream().map(RedemittelDto::id).toList();

        assertEquals(List.of("b1a", "b1b", "a2"), ids); // B1, B1, then A2 (tie with B2 broken by lower level)
    }

    @Test
    @DisplayName("today -> expressions the learner saved come first, even from another level")
    void todaySavedFirst() {
        when(progressRepository.countByUserIdAndLearnedAtAfter(eq("u1"), any())).thenReturn(0L);
        when(phraseRepository.findUnlearned("u1")).thenReturn(List.of(
                phrase("b1a", LearningLevel.B1, 0), phrase("b1b", LearningLevel.B1, 1), phrase("b1c", LearningLevel.B1, 2),
                phrase("c2", LearningLevel.C2, 0)));
        RedemittelCollectionItem saved = new RedemittelCollectionItem();
        saved.setPhraseId("c2");
        when(collectionRepository.findByUserId("u1")).thenReturn(List.of(saved));

        assertEquals("c2", service.today().get(0).id());
    }

    @Test
    @DisplayName("today -> only what is left of the target once some were learned today")
    void todayRespectsAlreadyLearned() {
        when(progressRepository.countByUserIdAndLearnedAtAfter(eq("u1"), any())).thenReturn(2L);
        when(phraseRepository.findUnlearned("u1")).thenReturn(List.of(phrase("a", LearningLevel.B1, 0), phrase("b", LearningLevel.B1, 1)));
        assertEquals(1, service.today().size());
    }

    @Test
    @DisplayName("today -> empty once the daily target is reached")
    void todayEmptyWhenDone() {
        when(progressRepository.countByUserIdAndLearnedAtAfter(eq("u1"), any())).thenReturn(3L);
        assertTrue(service.today().isEmpty());
        verify(phraseRepository, never()).findUnlearned(anyString());
    }

    @Test
    @DisplayName("today -> the daily target is configurable through the app setting")
    void todayConfigurableTarget() {
        when(appSettingService.getInt(RedemittelService.DAILY_NEW_KEY, 3)).thenReturn(1);
        when(progressRepository.countByUserIdAndLearnedAtAfter(eq("u1"), any())).thenReturn(0L);
        when(phraseRepository.findUnlearned("u1")).thenReturn(List.of(phrase("a", LearningLevel.B1, 0), phrase("b", LearningLevel.B1, 1)));
        assertEquals(1, service.today().size());
    }

    // ---- learn ----

    @Test
    @DisplayName("learn -> creates the caller's progress with the first review tomorrow")
    void learnCreatesProgress() throws Exception {
        when(phraseRepository.findById("p1")).thenReturn(Optional.of(phrase("p1", LearningLevel.B1, 0)));
        when(progressRepository.findByUserIdAndPhraseId("u1", "p1")).thenReturn(Optional.empty());

        service.learn("p1");

        ArgumentCaptor<RedemittelProgress> saved = ArgumentCaptor.forClass(RedemittelProgress.class);
        verify(progressRepository).save(saved.capture());
        assertEquals("u1", saved.getValue().getUserId());
        assertEquals("p1", saved.getValue().getPhraseId());
        assertEquals(RedemittelStatus.LEARNING, saved.getValue().getStatus());
        assertNotNull(saved.getValue().getNextReviewAt());
        verify(learningActivityService).track("u1", LearningModule.REDEMITTEL, LearningActivityType.REDEMITTEL_LEARNED, "p1");
    }

    @Test
    @DisplayName("learn -> repeating it does not reset the existing progress")
    void learnIsIdempotent() throws Exception {
        when(phraseRepository.findById("p1")).thenReturn(Optional.of(phrase("p1", LearningLevel.B1, 0)));
        when(progressRepository.findByUserIdAndPhraseId("u1", "p1")).thenReturn(Optional.of(new RedemittelProgress()));

        service.learn("p1");

        verify(progressRepository, never()).save(any());
    }

    @Test
    @DisplayName("learn -> an inactive (admin-hidden) Redemittel is not available")
    void learnInactive() {
        WritingPhrase hidden = phrase("p1", LearningLevel.B1, 0);
        hidden.setActive(false);
        when(phraseRepository.findById("p1")).thenReturn(Optional.of(hidden));
        assertThrows(DataNotFoundException.class, () -> service.learn("p1"));
    }

    // ---- collection ----

    @Test
    @DisplayName("save -> adds a link for the caller once, and unsave removes only the caller's")
    void saveAndUnsave() throws Exception {
        when(phraseRepository.findById("p1")).thenReturn(Optional.of(phrase("p1", LearningLevel.B1, 0)));
        when(collectionRepository.findByUserIdAndPhraseId("u1", "p1")).thenReturn(Optional.empty());

        service.save("p1");
        ArgumentCaptor<RedemittelCollectionItem> item = ArgumentCaptor.forClass(RedemittelCollectionItem.class);
        verify(collectionRepository).save(item.capture());
        assertEquals("u1", item.getValue().getUserId());

        service.unsave("p1");
        verify(collectionRepository).deleteByUserIdAndPhraseId("u1", "p1");
    }

    @Test
    @DisplayName("save -> saving twice does not create a second link")
    void saveIsIdempotent() throws Exception {
        when(phraseRepository.findById("p1")).thenReturn(Optional.of(phrase("p1", LearningLevel.B1, 0)));
        when(collectionRepository.findByUserIdAndPhraseId("u1", "p1")).thenReturn(Optional.of(new RedemittelCollectionItem()));
        service.save("p1");
        verify(collectionRepository, never()).save(any());
    }

    // ---- detail / isolation ----

    @Test
    @DisplayName("get -> returns the caller's own status and saved flag; progress is only ever looked up for the caller")
    void getIsScopedToCaller() throws Exception {
        when(phraseRepository.findById("p1")).thenReturn(Optional.of(phrase("p1", LearningLevel.B1, 0)));
        RedemittelProgress mine = new RedemittelProgress();
        mine.setPhraseId("p1");
        mine.setStatus(RedemittelStatus.REVIEW);
        when(progressRepository.findByUserIdAndPhraseIdIn("u1", List.of("p1"))).thenReturn(List.of(mine));

        RedemittelDto dto = service.get("p1");

        assertEquals(RedemittelStatus.REVIEW, dto.status());
        verify(progressRepository, never()).findByUserIdAndPhraseIdIn(eq("u2"), anyCollection());
    }

    @Test
    @DisplayName("get -> a phrase without progress is NEW and shows the language-matched meaning with German fallback")
    void getMeaningFallback() throws Exception {
        WritingPhrase p = phrase("p1", LearningLevel.B1, 0);
        p.setExplanation("Deutsche Erklärung");
        when(phraseRepository.findById("p1")).thenReturn(Optional.of(p));

        assertEquals(RedemittelStatus.NEW, service.get("p1").status());
        assertEquals("Deutsche Erklärung", service.get("p1").meaning());

        p.setMeaningEn("I think that …");
        assertEquals("I think that …", service.get("p1").meaning());
        when(requestContext.getLanguage()).thenReturn("FA");
        assertEquals("I think that …", service.get("p1").meaning()); // FA falls back to EN
        p.setMeaningFa("فارسی");
        assertEquals("فارسی", service.get("p1").meaning());
    }

    // ---- hub ----

    @Test
    @DisplayName("hub -> summary and counts come from the caller's real progress")
    void hubCounts() {
        when(phraseRepository.countByActiveTrue()).thenReturn(100L);
        when(progressRepository.countByUserId("u1")).thenReturn(10L);
        when(progressRepository.countByUserIdAndStatus("u1", RedemittelStatus.MASTERED)).thenReturn(2L);
        when(progressRepository.countByUserIdAndStatus("u1", RedemittelStatus.REVIEW)).thenReturn(3L);
        when(progressRepository.countByUserIdAndStatus("u1", RedemittelStatus.LEARNING)).thenReturn(5L);
        when(progressRepository.countByUserIdAndLearnedAtAfter(eq("u1"), any())).thenReturn(1L);
        when(progressRepository.countDue(eq("u1"), any())).thenReturn(4L);
        when(collectionRepository.countByUserId("u1")).thenReturn(7L);
        when(phraseRepository.countActiveByCategory()).thenReturn(List.<Object[]>of(
                new Object[]{"OPINION", 40L}, new Object[]{"AGREEMENT", 60L}));
        when(functionRepository.findAllByOrderBySortOrderAscLabelAsc()).thenReturn(RedemittelTestFunctions.all());

        RedemittelHubResponse hub = service.hub();

        assertEquals(4, hub.dueCount());
        assertEquals(2, hub.newToday()); // target 3 - 1 learned today
        assertEquals(7, hub.savedCount());
        assertEquals(10, hub.summary().learned());
        assertEquals(90, hub.summary().fresh());
        assertEquals(2, hub.summary().mastered());
        assertEquals(2, hub.categories().size());
        assertEquals("Zustimmen", hub.categories().stream().filter(c -> c.key().equals("AGREEMENT")).findFirst().orElseThrow().label());
    }

    @Test
    @DisplayName("hub -> newToday is limited by the Redemittel actually left")
    void hubNewTodayLimited() {
        when(phraseRepository.countByActiveTrue()).thenReturn(10L);
        when(progressRepository.countByUserId("u1")).thenReturn(9L);
        when(progressRepository.countByUserIdAndLearnedAtAfter(eq("u1"), any())).thenReturn(0L);
        when(phraseRepository.countActiveByCategory()).thenReturn(List.of());
        assertEquals(1, service.hub().newToday());
    }
}
