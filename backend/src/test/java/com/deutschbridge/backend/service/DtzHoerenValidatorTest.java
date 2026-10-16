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

class DtzHoerenValidatorTest {

    private static List<ExamPassage> recordings(int count) {
        List<ExamPassage> passages = new ArrayList<>();
        for (int i = 0; i < count; i++) passages.add(new ExamPassage("p" + i, "Ansage " + (i + 1), "", null, "/uploads/exam-audio/" + i + ".mp3", "<p>Skript</p>"));
        return passages;
    }

    private static ExamQuestion choice(int recording, String answer) {
        return new ExamQuestion(null, ExamTaskType.MULTIPLE_CHOICE, "Frage?", recording, List.of("A", "B", "C"), answer, null, null, "", "");
    }

    private static List<ExamQuestion> choices(int count) {
        List<ExamQuestion> questions = new ArrayList<>();
        for (int i = 0; i < count; i++) questions.add(choice(i, "B"));
        return questions;
    }

    private static ExamQuestion person(String name, String answer) {
        return new ExamQuestion(null, ExamTaskType.STATEMENT_MATCHING, name, 0, null, answer, null, null, "", "");
    }

    private static ExamExerciseManualRequest request(ExamType exam, ExamTaskType type, int part, List<ExamPassage> passages, List<ExamQuestion> questions, List<String> pool) {
        return new ExamExerciseManualRequest("Hören", ExamSection.HOERVERSTEHEN, type, LearningLevel.B1, part, passages, questions, pool,
                null, null, null, null, null, true, null, null, exam);
    }

    @Test
    @DisplayName("validate -> Teil 1 accepts four recordings with one three-option task each, Teil 2 five")
    void accepts_choiceParts() {
        assertDoesNotThrow(() -> DtzHoerenValidator.validate(request(ExamType.DTZ, ExamTaskType.MULTIPLE_CHOICE, 1, recordings(4), choices(4), null)));
        assertDoesNotThrow(() -> DtzHoerenValidator.validate(request(ExamType.DTZ, ExamTaskType.MULTIPLE_CHOICE, 2, recordings(5), choices(5), null)));
    }

    @Test
    @DisplayName("validate -> rejects wrong recording or task counts, double tasks, and bad answer keys")
    void rejects_badChoiceParts() {
        assertThrows(IllegalArgumentException.class, () -> DtzHoerenValidator.validate(request(ExamType.DTZ, ExamTaskType.MULTIPLE_CHOICE, 1, recordings(5), choices(5), null)));
        assertThrows(IllegalArgumentException.class, () -> DtzHoerenValidator.validate(request(ExamType.DTZ, ExamTaskType.MULTIPLE_CHOICE, 2, recordings(5), choices(4), null)));
        List<ExamQuestion> twice = choices(4);
        twice.set(3, choice(0, "B"));
        assertThrows(IllegalArgumentException.class, () -> DtzHoerenValidator.validate(request(ExamType.DTZ, ExamTaskType.MULTIPLE_CHOICE, 1, recordings(4), twice, null)));
        List<ExamQuestion> wrongKey = choices(4);
        wrongKey.set(0, choice(0, "Z"));
        assertThrows(IllegalArgumentException.class, () -> DtzHoerenValidator.validate(request(ExamType.DTZ, ExamTaskType.MULTIPLE_CHOICE, 1, recordings(4), wrongKey, null)));
    }

    @Test
    @DisplayName("validate -> Telc listening and other DTZ sections are not checked")
    void ignores_otherExams() {
        assertDoesNotThrow(() -> DtzHoerenValidator.validate(request(ExamType.TELC, ExamTaskType.MULTIPLE_CHOICE, 1, recordings(1), choices(1), null)));
        assertDoesNotThrow(() -> DtzHoerenValidator.validate(request(ExamType.DTZ, ExamTaskType.TRUE_FALSE_NOT_GIVEN, 1, recordings(1), choices(1), null)));
    }

    @Test
    @DisplayName("validate -> Teil 4 accepts one recording, three persons and distinct statements from a pool with distractors")
    void accepts_opinionMatching() {
        List<String> pool = List.of("Aussage 1", "Aussage 2", "Aussage 3", "Aussage 4", "Aussage 5");
        List<ExamQuestion> persons = List.of(person("Person 1", "Aussage 2"), person("Person 2", "Aussage 5"), person("Person 3", "Aussage 1"));
        assertDoesNotThrow(() -> DtzHoerenValidator.validate(request(ExamType.DTZ, ExamTaskType.STATEMENT_MATCHING, 4, recordings(1), persons, pool)));
    }

    @Test
    @DisplayName("validate -> Teil 4 rejects a reused statement, a statement outside the pool and wrong counts")
    void rejects_badOpinionMatching() {
        List<String> pool = List.of("Aussage 1", "Aussage 2", "Aussage 3", "Aussage 4");
        List<ExamQuestion> reused = List.of(person("Person 1", "Aussage 2"), person("Person 2", "Aussage 2"), person("Person 3", "Aussage 1"));
        assertThrows(IllegalArgumentException.class, () -> DtzHoerenValidator.validate(request(ExamType.DTZ, ExamTaskType.STATEMENT_MATCHING, 4, recordings(1), reused, pool)));
        List<ExamQuestion> outside = List.of(person("Person 1", "Aussage 2"), person("Person 2", "Aussage 9"), person("Person 3", "Aussage 1"));
        assertThrows(IllegalArgumentException.class, () -> DtzHoerenValidator.validate(request(ExamType.DTZ, ExamTaskType.STATEMENT_MATCHING, 4, recordings(1), outside, pool)));
        List<ExamQuestion> valid = List.of(person("Person 1", "Aussage 2"), person("Person 2", "Aussage 3"), person("Person 3", "Aussage 1"));
        assertThrows(IllegalArgumentException.class, () -> DtzHoerenValidator.validate(request(ExamType.DTZ, ExamTaskType.STATEMENT_MATCHING, 4, recordings(2), valid, pool)));
        assertThrows(IllegalArgumentException.class, () -> DtzHoerenValidator.validate(request(ExamType.DTZ, ExamTaskType.STATEMENT_MATCHING, 4, recordings(1), valid.subList(0, 2), pool)));
        assertThrows(IllegalArgumentException.class, () -> DtzHoerenValidator.validate(request(ExamType.DTZ, ExamTaskType.STATEMENT_MATCHING, 4, recordings(1), valid, List.of("a", "b"))));
    }

    @Test
    @DisplayName("DtzTextQuestionsValidator -> Hören Teil 3 needs four recordings, Lesen Teil 3 three texts")
    void listeningTeil3_needsFourRecordings() {
        List<ExamQuestion> tasks = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            tasks.add(new ExamQuestion(null, ExamTaskType.TRUE_FALSE, "Aussage", i, null, "RICHTIG", null, null, "", ""));
            tasks.add(choice(i, "B"));
        }
        ExamExerciseManualRequest four = request(ExamType.DTZ, ExamTaskType.TEXT_QUESTIONS, 3, recordings(4), tasks, null);
        assertDoesNotThrow(() -> DtzTextQuestionsValidator.validate(four));
        ExamExerciseManualRequest three = request(ExamType.DTZ, ExamTaskType.TEXT_QUESTIONS, 3, recordings(3), tasks.subList(0, 6), null);
        assertThrows(IllegalArgumentException.class, () -> DtzTextQuestionsValidator.validate(three));
    }
}
