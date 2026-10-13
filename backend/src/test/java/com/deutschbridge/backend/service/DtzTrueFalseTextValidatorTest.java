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

class DtzTrueFalseTextValidatorTest {

    private static ExamPassage text() {
        return new ExamPassage("a", "Informationen", "<p>Inhalt</p>", null, null, null);
    }

    private static ExamQuestion statement(int number, String answer) {
        return new ExamQuestion(null, ExamTaskType.TRUE_FALSE, "Aussage " + number, 0, null, answer, null, number, "", "");
    }

    private static List<ExamQuestion> validStatements() {
        return new ArrayList<>(List.of(statement(37, "RICHTIG"), statement(38, "FALSCH"), statement(39, "RICHTIG")));
    }

    private static ExamExerciseManualRequest request(ExamTaskType taskType, List<ExamPassage> passages, List<ExamQuestion> questions) {
        return new ExamExerciseManualRequest("Teil 4", ExamSection.LESEVERSTEHEN, taskType, LearningLevel.B1, 4,
                passages, questions, null, null, null, null, null, null, true, null, null, ExamType.DTZ);
    }

    @Test
    @DisplayName("validate -> accepts one text with three richtig/falsch statements 37-39")
    void accepts_wellFormedExercise() {
        assertDoesNotThrow(() -> DtzTrueFalseTextValidator.validate(request(ExamTaskType.TEXT_TRUE_FALSE, List.of(text()), validStatements())));
    }

    @Test
    @DisplayName("validate -> ignores every other task type")
    void ignoresOtherTaskTypes() {
        assertDoesNotThrow(() -> DtzTrueFalseTextValidator.validate(request(ExamTaskType.MULTIPLE_CHOICE, List.of(), List.of())));
    }

    @Test
    @DisplayName("validate -> rejects zero or two texts")
    void rejects_wrongTextCount() {
        assertThrows(IllegalArgumentException.class, () -> DtzTrueFalseTextValidator.validate(request(ExamTaskType.TEXT_TRUE_FALSE, List.of(), validStatements())));
        assertThrows(IllegalArgumentException.class, () -> DtzTrueFalseTextValidator.validate(request(ExamTaskType.TEXT_TRUE_FALSE, List.of(text(), text()), validStatements())));
    }

    @Test
    @DisplayName("validate -> rejects an empty text")
    void rejects_emptyText() {
        var empty = new ExamPassage("a", "Titel", "<p> </p>", null, null, null);
        assertThrows(IllegalArgumentException.class, () -> DtzTrueFalseTextValidator.validate(request(ExamTaskType.TEXT_TRUE_FALSE, List.of(empty), validStatements())));
    }

    @Test
    @DisplayName("validate -> rejects a statement count other than three")
    void rejects_wrongQuestionCount() {
        var two = validStatements();
        two.remove(2);
        assertThrows(IllegalArgumentException.class, () -> DtzTrueFalseTextValidator.validate(request(ExamTaskType.TEXT_TRUE_FALSE, List.of(text()), two)));
        var four = validStatements();
        four.add(statement(40, "FALSCH"));
        assertThrows(IllegalArgumentException.class, () -> DtzTrueFalseTextValidator.validate(request(ExamTaskType.TEXT_TRUE_FALSE, List.of(text()), four)));
    }

    @Test
    @DisplayName("validate -> rejects numbers other than 37, 38, 39")
    void rejects_wrongNumbers() {
        var wrong = new ArrayList<>(List.of(statement(31, "RICHTIG"), statement(32, "FALSCH"), statement(33, "RICHTIG")));
        assertThrows(IllegalArgumentException.class, () -> DtzTrueFalseTextValidator.validate(request(ExamTaskType.TEXT_TRUE_FALSE, List.of(text()), wrong)));
    }

    @Test
    @DisplayName("validate -> rejects other question types and answers other than RICHTIG / FALSCH")
    void rejects_wrongTypeOrAnswer() {
        var choice = validStatements();
        choice.set(1, new ExamQuestion(null, ExamTaskType.MULTIPLE_CHOICE, "Frage?", 0, List.of("A", "B", "C"), "A", null, 38, "", ""));
        assertThrows(IllegalArgumentException.class, () -> DtzTrueFalseTextValidator.validate(request(ExamTaskType.TEXT_TRUE_FALSE, List.of(text()), choice)));
        var badAnswer = validStatements();
        badAnswer.set(0, statement(37, "NICHT_IM_TEXT"));
        assertThrows(IllegalArgumentException.class, () -> DtzTrueFalseTextValidator.validate(request(ExamTaskType.TEXT_TRUE_FALSE, List.of(text()), badAnswer)));
    }
}
