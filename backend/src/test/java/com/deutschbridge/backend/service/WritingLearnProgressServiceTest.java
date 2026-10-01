package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.WritingLearnProgressDto;
import com.deutschbridge.backend.model.entity.WritingLearnProgress;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.WritingLearnProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WritingLearnProgressServiceTest {

    @Mock private WritingLearnProgressRepository repository;
    @Mock private RequestContext requestContext;

    private WritingLearnProgressService service;

    @BeforeEach
    void setUp() {
        service = new WritingLearnProgressService(repository, requestContext);
        when(requestContext.getUserId()).thenReturn("u1");
        when(repository.save(any(WritingLearnProgress.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private WritingLearnProgress existing(int correct, int total) {
        WritingLearnProgress p = new WritingLearnProgress();
        p.setUserId("u1");
        p.setLevel("B1");
        p.setStation("aufbau");
        p.setCorrect(correct);
        p.setTotal(total);
        return p;
    }

    @Test
    @DisplayName("save -> creates the station result the first time")
    void createsNew() {
        when(repository.findByUserIdAndLevelAndStation("u1", "B1", "aufbau")).thenReturn(Optional.empty());
        WritingLearnProgressDto res = service.save(LearningLevel.B1, "aufbau", 2, 4);
        assertEquals(2, res.correct());
        assertEquals(4, res.total());
    }

    @Test
    @DisplayName("save -> a worse repeat keeps the best result")
    void keepsBest() {
        when(repository.findByUserIdAndLevelAndStation("u1", "B1", "aufbau")).thenReturn(Optional.of(existing(4, 4)));
        WritingLearnProgressDto res = service.save(LearningLevel.B1, "aufbau", 1, 4);
        assertEquals(4, res.correct());
    }

    @Test
    @DisplayName("save -> a better repeat replaces the result")
    void improves() {
        when(repository.findByUserIdAndLevelAndStation("u1", "B1", "aufbau")).thenReturn(Optional.of(existing(1, 4)));
        WritingLearnProgressDto res = service.save(LearningLevel.B1, "aufbau", 3, 4);
        assertEquals(3, res.correct());
    }

    @Test
    @DisplayName("save -> rejects unknown stations and impossible results")
    void validates() {
        assertThrows(ResponseStatusException.class, () -> service.save(LearningLevel.B1, "unknown", 0, 0));
        assertThrows(ResponseStatusException.class, () -> service.save(LearningLevel.B1, "aufbau", 5, 4));
        assertThrows(ResponseStatusException.class, () -> service.save(LearningLevel.B1, "aufbau", -1, 4));
        assertThrows(ResponseStatusException.class, () -> service.save(LearningLevel.B1, "aufbau", 0, 1000));
    }

    @Test
    @DisplayName("isBetter -> a station without questions counts as a full score")
    void noQuestionStation() {
        assertTrue(WritingLearnProgressService.isBetter(0, 0, -1, 1));
        assertTrue(WritingLearnProgressService.isBetter(0, 0, 0, 0));
    }
}
