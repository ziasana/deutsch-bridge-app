package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.ExamExerciseManualRequest;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DtzAdMatchingValidatorTest {

    private static final List<String> ANSWERS = List.of("p1", "p2", "X", "p4", "p5");

    private static List<ExamQuestion> situations(List<String> answers) {
        List<ExamQuestion> questions = new ArrayList<>();
        for (int i = 0; i < answers.size(); i++) {
            questions.add(new ExamQuestion(null, ExamTaskType.SITUATION_MATCHING, "Situation " + i, null, null, answers.get(i), null, 26 + i, "", ""));
        }
        return questions;
    }

    private static List<ExamPassage> ads(int count) {
        List<ExamPassage> passages = new ArrayList<>();
        for (int i = 0; i < count; i++) passages.add(new ExamPassage("p" + (i + 1), String.valueOf((char) ('a' + i)), "<p>Anzeige</p>", null, null, null));
        return passages;
    }

    private static ExamExerciseManualRequest request(ExamType exam, Integer part, List<ExamPassage> passages, List<ExamQuestion> questions) {
        return new ExamExerciseManualRequest("Arbeit", ExamSection.LESEVERSTEHEN, ExamTaskType.SITUATION_MATCHING, LearningLevel.B1, part,
                passages, questions, null, null, null, null, null, null, true, null, null, exam);
    }

    @Test
    @DisplayName("validate -> accepts five situations, eight advertisements and exactly one X")
    void accepts_wellFormedExercise() {
        assertDoesNotThrow(() -> DtzAdMatchingValidator.validate(request(ExamType.DTZ, 2, ads(8), situations(ANSWERS))));
    }

    @Test
    @DisplayName("validate -> TELC situation matching and other DTZ parts are not checked")
    void ignores_otherExamsAndParts() {
        assertDoesNotThrow(() -> DtzAdMatchingValidator.validate(request(ExamType.TELC, 3, ads(12), situations(List.of("p1")))));
        assertDoesNotThrow(() -> DtzAdMatchingValidator.validate(request(ExamType.DTZ, 3, ads(12), situations(List.of("p1")))));
    }

    @Test
    @DisplayName("validate -> rejects wrong situation or advertisement counts")
    void rejects_wrongCounts() {
        assertThrows(IllegalArgumentException.class, () -> DtzAdMatchingValidator.validate(request(ExamType.DTZ, 2, ads(8), situations(ANSWERS.subList(0, 4)))));
        assertThrows(IllegalArgumentException.class, () -> DtzAdMatchingValidator.validate(request(ExamType.DTZ, 2, ads(7), situations(ANSWERS))));
        assertThrows(IllegalArgumentException.class, () -> DtzAdMatchingValidator.validate(request(ExamType.DTZ, 2, ads(9), situations(ANSWERS))));
    }

    @Test
    @DisplayName("validate -> rejects zero or two X answers and a reused advertisement")
    void rejects_wrongAnswerPattern() {
        assertThrows(IllegalArgumentException.class, () -> DtzAdMatchingValidator.validate(
                request(ExamType.DTZ, 2, ads(8), situations(List.of("p1", "p2", "p3", "p4", "p5")))));
        assertThrows(IllegalArgumentException.class, () -> DtzAdMatchingValidator.validate(
                request(ExamType.DTZ, 2, ads(8), situations(List.of("p1", "p2", "X", "x", "p5")))));
        assertThrows(IllegalArgumentException.class, () -> DtzAdMatchingValidator.validate(
                request(ExamType.DTZ, 2, ads(8), situations(List.of("p1", "p1", "X", "p4", "p5")))));
    }
}
