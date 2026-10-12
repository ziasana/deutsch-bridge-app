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

class DtzTextQuestionsValidatorTest {

    private static ExamPassage passage(String id) {
        return new ExamPassage(id, "Text", "<p>Inhalt</p>", null, null, null);
    }

    private static ExamQuestion trueFalse(int textIndex, String answer) {
        return new ExamQuestion(null, ExamTaskType.TRUE_FALSE, "Aussage", textIndex, null, answer, null, null, "", "");
    }

    private static ExamQuestion choice(int textIndex, String answer) {
        return new ExamQuestion(null, ExamTaskType.MULTIPLE_CHOICE, "Frage?", textIndex, List.of("A", "B", "C"), answer, null, null, "", "");
    }

    private static ExamExerciseManualRequest request(ExamTaskType taskType, List<ExamPassage> passages, List<ExamQuestion> questions) {
        return new ExamExerciseManualRequest("Teil 3", ExamSection.LESEVERSTEHEN, taskType, LearningLevel.B1, 3,
                passages, questions, null, null, null, null, null, null, true, null, null, ExamType.DTZ);
    }

    @Test
    @DisplayName("validate -> accepts texts that each have one richtig/falsch and one multiple-choice task")
    void accepts_wellFormedExercise() {
        var req = request(ExamTaskType.TEXT_QUESTIONS, List.of(passage("a"), passage("b")),
                List.of(trueFalse(0, "RICHTIG"), choice(0, "B"), trueFalse(1, "FALSCH"), choice(1, "C")));
        assertDoesNotThrow(() -> DtzTextQuestionsValidator.validate(req));
    }

    @Test
    @DisplayName("validate -> ignores every other task type")
    void ignoresOtherTaskTypes() {
        assertDoesNotThrow(() -> DtzTextQuestionsValidator.validate(request(ExamTaskType.MULTIPLE_CHOICE, List.of(), List.of())));
    }

    @Test
    @DisplayName("validate -> rejects a text with a missing task")
    void rejects_missingTask() {
        var req = request(ExamTaskType.TEXT_QUESTIONS, List.of(passage("a")), List.of(trueFalse(0, "RICHTIG")));
        assertThrows(IllegalArgumentException.class, () -> DtzTextQuestionsValidator.validate(req));
    }

    @Test
    @DisplayName("validate -> rejects NICHT_IM_TEXT, which DTZ does not have")
    void rejects_nichtImText() {
        var req = request(ExamTaskType.TEXT_QUESTIONS, List.of(passage("a")), List.of(trueFalse(0, "NICHT_IM_TEXT"), choice(0, "A")));
        assertThrows(IllegalArgumentException.class, () -> DtzTextQuestionsValidator.validate(req));
    }

    @Test
    @DisplayName("validate -> rejects a multiple-choice answer that is not one of the options")
    void rejects_answerNotInOptions() {
        var req = request(ExamTaskType.TEXT_QUESTIONS, List.of(passage("a")), List.of(trueFalse(0, "FALSCH"), choice(0, "Z")));
        assertThrows(IllegalArgumentException.class, () -> DtzTextQuestionsValidator.validate(req));
    }

    @Test
    @DisplayName("validate -> rejects a task pointing at a text that does not exist")
    void rejects_badTextIndex() {
        var questions = new ArrayList<>(List.of(trueFalse(0, "RICHTIG"), choice(0, "A")));
        questions.add(trueFalse(5, "RICHTIG"));
        var req = request(ExamTaskType.TEXT_QUESTIONS, List.of(passage("a")), questions);
        assertThrows(IllegalArgumentException.class, () -> DtzTextQuestionsValidator.validate(req));
    }
}
