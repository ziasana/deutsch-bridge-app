package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.entity.SpeakingLearnProgress;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.SpeakingLearnProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SpeakingLearnProgressServiceTest {

    private SpeakingLearnProgressRepository repository;
    private SpeakingLearnProgressService service;

    @BeforeEach
    void setUp() {
        repository = mock(SpeakingLearnProgressRepository.class);
        RequestContext context = mock(RequestContext.class);
        when(context.getUserId()).thenReturn("u1");
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        service = new SpeakingLearnProgressService(repository, context);
    }

    @Test
    void savesANewStationForTheCallerAndTeil() {
        when(repository.findByUserIdAndLevelAndPartNumberAndStation("u1", "B1", 2, "tipps")).thenReturn(Optional.empty());
        var result = service.save(LearningLevel.B1, 2, "tipps", 3, 4);
        assertEquals(2, result.part());
        assertEquals("tipps", result.station());
        assertEquals(3, result.correct());
        verify(repository).save(argThat(p -> p.getUserId().equals("u1") && p.getPartNumber() == 2 && p.getLevel().equals("B1")));
    }

    @Test
    void keepsTheBetterResultWhenRepeated() {
        SpeakingLearnProgress existing = new SpeakingLearnProgress();
        existing.setCorrect(4);
        existing.setTotal(4);
        existing.setPartNumber(1);
        existing.setStation("fragen");
        when(repository.findByUserIdAndLevelAndPartNumberAndStation("u1", "B1", 1, "fragen")).thenReturn(Optional.of(existing));
        var result = service.save(LearningLevel.B1, 1, "fragen", 1, 4);
        assertEquals(4, result.correct());
    }

    @Test
    void rejectsUnknownStationsPartsAndImpossibleResults() {
        assertThrows(ResponseStatusException.class, () -> service.save(LearningLevel.B1, 1, "hacked", 0, 0));
        assertThrows(ResponseStatusException.class, () -> service.save(LearningLevel.B1, 4, "tipps", 0, 0));
        assertThrows(ResponseStatusException.class, () -> service.save(LearningLevel.B1, 1, "tipps", 5, 4));
        assertThrows(ResponseStatusException.class, () -> service.save(LearningLevel.B1, 1, "tipps", 0, 1000));
        verify(repository, never()).save(any());
    }

    @Test
    void resetOnlyTouchesTheCallersTeil() {
        service.reset(LearningLevel.B1, 3);
        verify(repository).deleteByUserIdAndLevelAndPartNumber("u1", "B1", 3);
        assertThrows(ResponseStatusException.class, () -> service.reset(LearningLevel.B1, 0));
    }
}
