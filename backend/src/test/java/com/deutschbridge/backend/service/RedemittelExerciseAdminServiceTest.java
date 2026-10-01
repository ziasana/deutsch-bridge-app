package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AdminRedemittelExerciseDto;
import com.deutschbridge.backend.model.entity.RedemittelExercise;
import com.deutschbridge.backend.model.enums.RedemittelExerciseType;
import com.deutschbridge.backend.repository.RedemittelExerciseRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

class RedemittelExerciseAdminServiceTest {

    private static AdminRedemittelExerciseDto dto(RedemittelExerciseType type, String prompt, String correct, String... wrong) {
        return new AdminRedemittelExerciseDto(null, type, prompt, correct, List.of(wrong), 0);
    }

    private static void rejects(AdminRedemittelExerciseDto dto) {
        assertThrows(ResponseStatusException.class, () -> RedemittelExerciseAdminService.toEntity("p1", dto, 0));
    }

    @Test
    @DisplayName("meaning -> needs a correct answer and at least two different wrong ones")
    void meaningRules() {
        assertDoesNotThrow(() -> RedemittelExerciseAdminService.toEntity("p1", dto(RedemittelExerciseType.MEANING, null, "I think", "I am sorry", "Hello"), 0));
        rejects(dto(RedemittelExerciseType.MEANING, null, null, "a", "b"));
        rejects(dto(RedemittelExerciseType.MEANING, null, "x", "a"));
        rejects(dto(RedemittelExerciseType.MEANING, null, "x", "a", "A"));
        rejects(dto(RedemittelExerciseType.MEANING, null, "x", "a", "X"));
    }

    @Test
    @DisplayName("situation -> also needs the situation text")
    void situationRules() {
        rejects(dto(RedemittelExerciseType.SITUATION, " ", "x", "a", "b"));
        assertDoesNotThrow(() -> RedemittelExerciseAdminService.toEntity("p1", dto(RedemittelExerciseType.SITUATION, "Du stimmst zu.", "x", "a", "b"), 0));
    }

    @Test
    @DisplayName("fill blank -> the sentence must contain a blank and the missing word is required")
    void fillBlankRules() {
        rejects(dto(RedemittelExerciseType.FILL_BLANK, "Ich bin der Meinung", "Meinung"));
        rejects(dto(RedemittelExerciseType.FILL_BLANK, "Ich bin der ________, dass", null));
        RedemittelExercise e = RedemittelExerciseAdminService.toEntity("p1", dto(RedemittelExerciseType.FILL_BLANK, "Ich bin der ________, dass", "Meinung", "ignored"), 3);
        assertNull(e.getWrongAnswers());
        assertEquals(3, e.getSortOrder());
    }

    @Test
    @DisplayName("production -> only a topic is needed")
    void productionRules() {
        rejects(dto(RedemittelExerciseType.PRODUCTION, null, null));
        RedemittelExercise e = RedemittelExerciseAdminService.toEntity("p1", dto(RedemittelExerciseType.PRODUCTION, "Thema", "x", "y"), 0);
        assertNull(e.getCorrectAnswer());
        assertNull(e.getWrongAnswers());
    }

    @Test
    @DisplayName("replace -> validates everything first, then swaps the whole set; unknown phrase is not found")
    void replace() throws Exception {
        RedemittelExerciseRepository exercises = mock(RedemittelExerciseRepository.class);
        WritingPhraseRepository phrases = mock(WritingPhraseRepository.class);
        when(phrases.existsById("p1")).thenReturn(true);
        when(exercises.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        RedemittelExerciseAdminService service = new RedemittelExerciseAdminService(exercises, phrases);

        service.replace("p1", List.of(dto(RedemittelExerciseType.PRODUCTION, "Thema", null)));
        verify(exercises).deleteByPhraseId("p1");

        assertThrows(ResponseStatusException.class, () -> service.replace("p1", List.of(dto(RedemittelExerciseType.MEANING, null, "x"))));
        verify(exercises, times(1)).deleteByPhraseId("p1"); // the invalid save did not delete anything
        assertThrows(DataNotFoundException.class, () -> service.replace("nope", List.of()));
        verify(exercises, times(1)).saveAll(anyList()); // only the first, valid replace saved anything
    }
}
