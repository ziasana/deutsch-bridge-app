package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.LearningProgressRequest;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.NomenVerbConnection;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LearningProgressServiceTest {

    @Mock
    private LearningProgressRepository repository;

    @Mock
    private RequestContext requestContext;

    @Mock
    private UserService userService;

    @Mock
    private NomenVerbConnectionService nomenVerbConnectionService;

    @Mock
    private GrammarService grammarService;

    @InjectMocks
    private LearningProgressService service;


    private User createUser() {
        User user = new User();
        user.setId("u1");
        user.setEmail("test@mail.com");
        return user;
    }


    // ---------------------------------------------------------------
    // findAll
    // ---------------------------------------------------------------
    @Test
    @DisplayName("findAll -> should return all learning progress")
    void findAll_shouldReturnAll() {
        when(repository.findAll()).thenReturn(List.of(new LearningProgress()));

        List<LearningProgress> result = service.findAll();

        assertEquals(1, result.size());
        verify(repository).findAll();
    }

    // ---------------------------------------------------------------
    // findById
    // ---------------------------------------------------------------
    @Test
    @DisplayName("finById -> should return optional")
    void finById_shouldReturnOptional() {
        LearningProgress lp = new LearningProgress();
        when(repository.findById("1")).thenReturn(Optional.of(lp));

        Optional<LearningProgress> result = service.finById("1");

        assertTrue(result.isPresent());
        verify(repository).findById("1");
    }

    // ---------------------------------------------------------------
    // save
    // ---------------------------------------------------------------
    @Test
    @DisplayName("save -> should create new progress for grammar lesson")
    void save_shouldCreateLessonProgress() throws DataNotFoundException {
        User user = createUser();
        GrammarLesson lesson = new GrammarLesson();

        LearningProgressRequest request =
                new LearningProgressRequest("lesson1", null, null, null, true);

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(grammarService.findById("lesson1")).thenReturn(lesson);
        when(repository.findByUserAndLesson(user, lesson))
                .thenReturn(Optional.empty());

        service.save(request);

        verify(repository).save(argThat(progress ->
                progress.getUser().equals(user) &&
                        progress.getLesson().equals(lesson) &&
                        progress.getIsLearned()
        ));
    }

    @Test
    @DisplayName("save -> should update existing progress for grammar lesson")
    void save_shouldUpdateLessonProgress() throws DataNotFoundException {
        User user = createUser();
        GrammarLesson lesson = new GrammarLesson();
        LearningProgress existing = new LearningProgress();

        LearningProgressRequest request =
                new LearningProgressRequest("lesson1", null, null, null, false);

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(grammarService.findById("lesson1")).thenReturn(lesson);
        when(repository.findByUserAndLesson(user, lesson))
                .thenReturn(Optional.of(existing));

        service.save(request);

        verify(repository).save(existing);
        assertFalse(existing.getIsLearned());
    }

    // ---------------------------------------------------------------
    // save
    // ---------------------------------------------------------------
    @Test
    @DisplayName("save -> should create new progress for nomen verb")
    void save_shouldCreateNomenVerbProgress() throws DataNotFoundException {
        User user = createUser();
        NomenVerbConnection nv = new NomenVerbConnection();

        LearningProgressRequest request =
                new LearningProgressRequest(null, "nv1", null, null, true);

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(nomenVerbConnectionService.findById("nv1")).thenReturn(nv);
        when(repository.findByUserAndNomenVerb(user, nv))
                .thenReturn(Optional.empty());

        service.save(request);

        verify(repository).save(argThat(progress ->
                progress.getUser().equals(user) &&
                        progress.getNomenVerb().equals(nv) &&
                        progress.getIsLearned()
        ));
    }

    @Test
    @DisplayName("save -> should update existing progress for nomen verb")
    void save_shouldUpdateNomenVerbProgress() throws DataNotFoundException {
        User user = createUser();
        NomenVerbConnection nv = new NomenVerbConnection();
        LearningProgress existing = new LearningProgress();

        LearningProgressRequest request =
                new LearningProgressRequest(null, "nv1", null, null, false);

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(nomenVerbConnectionService.findById("nv1")).thenReturn(nv);
        when(repository.findByUserAndNomenVerb(user, nv))
                .thenReturn(Optional.of(existing));

        service.save(request);

        verify(repository).save(existing);
        assertFalse(existing.getIsLearned());
    }
}