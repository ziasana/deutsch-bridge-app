package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ExamAttemptExplanationLanguageTest {

    private static ExamExercise exercise() {
        ExamExercise e = new ExamExercise();
        e.setMetadata(Map.of("gapQuestions", List.of(
                Map.of("number", 21, "explanation", Map.of("en", "English tip", "fa", "توضیح فارسی")),
                Map.of("number", 22, "explanation", Map.of("en", "Only English")))));
        return e;
    }

    private static ExamQuestion gap(int number) {
        ExamQuestion q = new ExamQuestion();
        q.setGapNumber(number);
        q.setExplanation("Deutsche Erklärung");
        return q;
    }

    @Test
    void persianLearnersGetThePersianExplanation() {
        assertEquals("توضیح فارسی", ExamAttemptService.localizedExplanation(exercise(), gap(21), "PR"));
        assertEquals("توضیح فارسی", ExamAttemptService.localizedExplanation(exercise(), gap(21), "fa"));
    }

    @Test
    void englishAndGermanLearnersGetTheirLanguage() {
        assertEquals("English tip", ExamAttemptService.localizedExplanation(exercise(), gap(21), "EN"));
        assertEquals("Deutsche Erklärung", ExamAttemptService.localizedExplanation(exercise(), gap(21), "DE"));
    }

    @Test
    void missingTranslationsFallBackToGerman() {
        assertEquals("Deutsche Erklärung", ExamAttemptService.localizedExplanation(exercise(), gap(22), "PR"));
        assertEquals("Deutsche Erklärung", ExamAttemptService.localizedExplanation(exercise(), gap(25), "PR"));
        ExamQuestion plain = new ExamQuestion();
        plain.setExplanation("Deutsch");
        assertEquals("Deutsch", ExamAttemptService.localizedExplanation(new ExamExercise(), plain, "PR"));
        assertEquals("Deutsche Erklärung", ExamAttemptService.localizedExplanation(exercise(), gap(21), null));
    }
}
