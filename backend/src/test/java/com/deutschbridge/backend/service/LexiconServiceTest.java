package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.SaveLexiconRequest;
import com.deutschbridge.backend.model.dto.SrsReviewRequest;
import com.deutschbridge.backend.model.dto.UserWordProgressResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserWordProgress;
import com.deutschbridge.backend.model.enums.AnnotationType;
import com.deutschbridge.backend.model.enums.WordProgressStatus;
import com.deutschbridge.backend.repository.UserWordProgressRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LexiconServiceTest {

    @Mock
    private UserWordProgressRepository repository;

    @Mock
    private RequestContext requestContext;

    @Mock
    private UserService userService;

    @InjectMocks
    private LexiconService service;

    private User createUser() {
        User user = new User();
        user.setId("u1");
        user.setEmail("test@mail.com");
        return user;
    }

    // ---------------------------------------------------------------
    // save
    // ---------------------------------------------------------------
    @Test
    @DisplayName("save -> should create new lexicon entry when none exists")
    void save_shouldCreateNewEntry() {
        User user = createUser();
        SaveLexiconRequest request = new SaveLexiconRequest("eine Entscheidung treffen", AnnotationType.NOMEN_VERB_VERBINDUNG, "article1", "Sie hat eine Entscheidung getroffen.", "to make a decision");

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(repository.findByUserAndLemma(user, request.lemma())).thenReturn(Optional.empty());
        when(repository.save(argThat(p -> true))).thenAnswer(inv -> inv.getArgument(0));

        UserWordProgressResponse response = service.save(request);

        assertEquals("eine Entscheidung treffen", response.lemma());
        assertEquals(WordProgressStatus.NEW, response.status());
        assertEquals(1, response.timesSeen());
        verify(repository).save(argThat(p ->
                p.getUser().equals(user) &&
                        p.getFirstSeenArticleId().equals("article1") &&
                        p.getFirstSeenSentence().equals(request.sentence())
        ));
    }

    @Test
    @DisplayName("save -> should bump timesSeen on an existing lexicon entry instead of duplicating it")
    void save_shouldBumpExistingEntry() {
        User user = createUser();
        UserWordProgress existing = new UserWordProgress();
        existing.setUser(user);
        existing.setLemma("Kritik üben");
        existing.setStatus(WordProgressStatus.LEARNING);
        existing.setTimesSeen(2);

        SaveLexiconRequest request = new SaveLexiconRequest("Kritik üben", AnnotationType.NOMEN_VERB_VERBINDUNG, "article2", "Er übte Kritik an dem Vorschlag.", "to criticize");

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(repository.findByUserAndLemma(user, request.lemma())).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        UserWordProgressResponse response = service.save(request);

        assertEquals(3, response.timesSeen());
        assertEquals(WordProgressStatus.LEARNING, response.status());
        verify(repository).save(existing);
    }

    // ---------------------------------------------------------------
    // getAll
    // ---------------------------------------------------------------
    @Test
    @DisplayName("getAll -> should return the current user's lexicon")
    void getAll_shouldReturnUserLexicon() {
        User user = createUser();
        UserWordProgress progress = new UserWordProgress();
        progress.setUser(user);
        progress.setLemma("Rücksicht nehmen");

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(repository.findByUser(user)).thenReturn(List.of(progress));

        List<UserWordProgressResponse> result = service.getAll();

        assertEquals(1, result.size());
        assertEquals("Rücksicht nehmen", result.get(0).lemma());
    }

    // ---------------------------------------------------------------
    // getReviewQueue
    // ---------------------------------------------------------------
    @Test
    @DisplayName("getReviewQueue -> should exclude KNOWN words and cards not yet due")
    void getReviewQueue_shouldExcludeKnownAndNotYetDue() {
        User user = createUser();

        UserWordProgress due = new UserWordProgress();
        due.setLemma("fällig");
        due.setStatus(WordProgressStatus.NEW);
        due.setSrsDueAt(LocalDateTime.now().minusDays(1));

        UserWordProgress notYetDue = new UserWordProgress();
        notYetDue.setLemma("spaeter");
        notYetDue.setStatus(WordProgressStatus.LEARNING);
        notYetDue.setSrsDueAt(LocalDateTime.now().plusDays(3));

        UserWordProgress known = new UserWordProgress();
        known.setLemma("bekannt");
        known.setStatus(WordProgressStatus.KNOWN);
        known.setSrsDueAt(LocalDateTime.now().minusDays(1));

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(repository.findByUser(user)).thenReturn(List.of(due, notYetDue, known));

        List<UserWordProgressResponse> queue = service.getReviewQueue();

        assertEquals(1, queue.size());
        assertEquals("fällig", queue.get(0).lemma());
    }

    // ---------------------------------------------------------------
    // review (SM-2)
    // ---------------------------------------------------------------
    @Test
    @DisplayName("review -> should throw when the lemma isn't in the user's lexicon")
    void review_shouldThrowWhenLemmaNotFound() {
        User user = createUser();
        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(repository.findByUserAndLemma(user, "unknown")).thenReturn(Optional.empty());

        assertThrows(DataNotFoundException.class, () -> service.review(new SrsReviewRequest("unknown", true)));
    }

    @Test
    @DisplayName("review -> first correct review should set a 1-day interval and keep status LEARNING")
    void review_firstCorrectReview() throws DataNotFoundException {
        User user = createUser();
        UserWordProgress progress = new UserWordProgress();
        progress.setLemma("Haus");
        progress.setStatus(WordProgressStatus.NEW);

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(repository.findByUserAndLemma(user, "Haus")).thenReturn(Optional.of(progress));
        when(repository.save(progress)).thenReturn(progress);

        service.review(new SrsReviewRequest("Haus", true));

        assertEquals(1, progress.getSrsInterval());
        assertEquals(1, progress.getSrsRepetitions());
        assertEquals(WordProgressStatus.LEARNING, progress.getStatus());
        assertTrue(progress.getSrsDueAt().isAfter(LocalDateTime.now()));
    }

    @Test
    @DisplayName("review -> should graduate to KNOWN after three consecutive correct reviews")
    void review_shouldGraduateToKnownAfterThreeCorrectReviews() throws DataNotFoundException {
        User user = createUser();
        UserWordProgress progress = new UserWordProgress();
        progress.setLemma("Garten");
        progress.setStatus(WordProgressStatus.NEW);

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(repository.findByUserAndLemma(user, "Garten")).thenReturn(Optional.of(progress));
        when(repository.save(progress)).thenReturn(progress);

        service.review(new SrsReviewRequest("Garten", true));
        assertEquals(WordProgressStatus.LEARNING, progress.getStatus());
        service.review(new SrsReviewRequest("Garten", true));
        assertEquals(WordProgressStatus.LEARNING, progress.getStatus());
        service.review(new SrsReviewRequest("Garten", true));

        assertEquals(WordProgressStatus.KNOWN, progress.getStatus());
        assertEquals(3, progress.getSrsRepetitions());
    }

    @Test
    @DisplayName("review -> an incorrect review should reset the interval, demote KNOWN back to LEARNING, and lower the ease factor")
    void review_incorrectReviewResetsProgress() throws DataNotFoundException {
        User user = createUser();
        UserWordProgress progress = new UserWordProgress();
        progress.setLemma("Fenster");
        progress.setStatus(WordProgressStatus.KNOWN);
        progress.setSrsRepetitions(3);
        progress.setSrsInterval(20);
        progress.setSrsEaseFactor(2.6);

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(repository.findByUserAndLemma(user, "Fenster")).thenReturn(Optional.of(progress));
        when(repository.save(progress)).thenReturn(progress);

        service.review(new SrsReviewRequest("Fenster", false));

        assertEquals(0, progress.getSrsRepetitions());
        assertEquals(1, progress.getSrsInterval());
        assertEquals(2.4, progress.getSrsEaseFactor(), 0.0001);
        assertEquals(WordProgressStatus.LEARNING, progress.getStatus());
    }

    @Test
    @DisplayName("review -> ease factor should never drop below the SM-2 floor of 1.3")
    void review_easeFactorShouldNotDropBelowFloor() throws DataNotFoundException {
        User user = createUser();
        UserWordProgress progress = new UserWordProgress();
        progress.setLemma("Tisch");
        progress.setSrsEaseFactor(1.35);

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(repository.findByUserAndLemma(user, "Tisch")).thenReturn(Optional.of(progress));
        when(repository.save(progress)).thenReturn(progress);

        service.review(new SrsReviewRequest("Tisch", false));

        assertEquals(1.3, progress.getSrsEaseFactor(), 0.0001);
    }
}
