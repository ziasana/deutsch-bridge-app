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

class DtzDirectoryValidatorTest {

    private static ExamQuestion question(List<String> options, String answer) {
        return new ExamQuestion(null, ExamTaskType.MULTIPLE_CHOICE, "Situation?", 0, options, answer, null, null, "", "");
    }

    private static List<ExamQuestion> five() {
        List<ExamQuestion> questions = new ArrayList<>();
        for (int i = 0; i < 5; i++) questions.add(question(List.of("1. OG", "2. OG", "3. OG"), "2. OG"));
        return questions;
    }

    private static ExamExerciseManualRequest request(ExamTaskType taskType, String sourceHtml, List<ExamQuestion> questions) {
        return new ExamExerciseManualRequest("Im Rathaus", ExamSection.LESEVERSTEHEN, taskType, LearningLevel.B1, 1,
                List.of(new ExamPassage("p", "Wegweiser", sourceHtml, null, null, null)), questions, null, null, null, null, null, null, true, null, null,
                ExamType.DTZ);
    }

    @Test
    @DisplayName("validate -> accepts a source with five situations of three options each")
    void accepts_wellFormedExercise() {
        assertDoesNotThrow(() -> DtzDirectoryValidator.validate(request(ExamTaskType.DIRECTORY_MATCHING, "<p>Amt</p>", five())));
    }

    @Test
    @DisplayName("validate -> ignores every other task type")
    void ignoresOtherTaskTypes() {
        assertDoesNotThrow(() -> DtzDirectoryValidator.validate(request(ExamTaskType.MULTIPLE_CHOICE, "", List.of())));
    }

    @Test
    @DisplayName("validate -> rejects a missing source, a wrong question count and broken options")
    void rejectsBrokenExercises() {
        assertThrows(IllegalArgumentException.class, () -> DtzDirectoryValidator.validate(request(ExamTaskType.DIRECTORY_MATCHING, " ", five())));
        assertThrows(IllegalArgumentException.class, () -> DtzDirectoryValidator.validate(request(ExamTaskType.DIRECTORY_MATCHING, "<p>x</p>", five().subList(0, 4))));

        List<ExamQuestion> twoOptions = five();
        twoOptions.set(1, question(List.of("1. OG", "2. OG"), "1. OG"));
        assertThrows(IllegalArgumentException.class, () -> DtzDirectoryValidator.validate(request(ExamTaskType.DIRECTORY_MATCHING, "<p>x</p>", twoOptions)));

        List<ExamQuestion> repeated = five();
        repeated.set(2, question(List.of("1. OG", "1. OG", "3. OG"), "1. OG"));
        assertThrows(IllegalArgumentException.class, () -> DtzDirectoryValidator.validate(request(ExamTaskType.DIRECTORY_MATCHING, "<p>x</p>", repeated)));

        List<ExamQuestion> wrongAnswer = five();
        wrongAnswer.set(3, question(List.of("1. OG", "2. OG", "3. OG"), "4. OG"));
        assertThrows(IllegalArgumentException.class, () -> DtzDirectoryValidator.validate(request(ExamTaskType.DIRECTORY_MATCHING, "<p>x</p>", wrongAnswer)));
    }
}
