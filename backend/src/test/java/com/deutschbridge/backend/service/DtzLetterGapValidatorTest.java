package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** The manual-save / publish check of DTZ Lesen Teil 5 (one letter with the gaps 40-45 and six multiple-choice gap questions). */
class DtzLetterGapValidatorTest {

    private static String gap(int n) {
        return "<span data-exam-gap=\"" + n + "\" class=\"exam-gap-marker\">" + n + "</span>";
    }

    private static ExamPassage letter(int... numbers) {
        StringBuilder html = new StringBuilder("<p>Sehr geehrte Damen und Herren, ");
        for (int n : numbers) html.append("Satz ").append(gap(n)).append(". ");
        return new ExamPassage("p1", "Brief", html.append("</p>").toString(), null, null, null);
    }

    private static ExamQuestion gapQuestion(int n) {
        return new ExamQuestion("q" + n, ExamTaskType.MULTIPLE_CHOICE, "Lücke " + n, 0, List.of("a" + n, "b" + n, "c" + n), "b" + n, n, n, "Erklärung", null);
    }

    private static List<ExamQuestion> questions() {
        List<ExamQuestion> list = new ArrayList<>();
        for (int n = 40; n <= 45; n++) list.add(gapQuestion(n));
        return list;
    }

    @Test
    void acceptsOneLetterWithSixGapsAndAnOptionalExample() {
        assertNull(DtzLetterGapValidator.check(List.of(letter(40, 41, 42, 43, 44, 45)), questions()));
        ExamPassage example = new ExamPassage("p0", "Beispiel", "<p>Sehr geehrte</p>", null, null, null);
        assertNull(DtzLetterGapValidator.check(List.of(example, letter(40, 41, 42, 43, 44, 45)), questions()));
    }

    @Test
    void rejectsMissingDuplicateUnexpectedOrMisorderedGaps() {
        assertNotNull(DtzLetterGapValidator.check(List.of(letter(40, 41, 42, 43, 44)), questions()));
        assertNotNull(DtzLetterGapValidator.check(List.of(letter(40, 41, 42, 43, 44, 44, 45)), questions()));
        assertNotNull(DtzLetterGapValidator.check(List.of(letter(40, 41, 42, 43, 44, 45, 46)), questions()));
        assertNotNull(DtzLetterGapValidator.check(List.of(letter(41, 40, 42, 43, 44, 45)), questions()));
        assertNotNull(DtzLetterGapValidator.check(List.of(), questions()));
        assertNotNull(DtzLetterGapValidator.check(List.of(letter(40, 41, 42, 43, 44, 45), letter(40, 41, 42, 43, 44, 45)), questions()));
    }

    @Test
    void rejectsWrongQuestionsAndOptions() {
        List<ExamPassage> text = List.of(letter(40, 41, 42, 43, 44, 45));
        List<ExamQuestion> fewer = questions();
        fewer.remove(5);
        assertNotNull(DtzLetterGapValidator.check(text, fewer));
        List<ExamQuestion> renumbered = questions();
        renumbered.get(0).setQuestionNumber(39);
        assertNotNull(DtzLetterGapValidator.check(text, renumbered));
        List<ExamQuestion> mismatch = questions();
        mismatch.get(1).setGapNumber(44);
        assertNotNull(DtzLetterGapValidator.check(text, mismatch));
        List<ExamQuestion> twoOptions = questions();
        twoOptions.get(2).setOptions(List.of("a", "b"));
        assertNotNull(DtzLetterGapValidator.check(text, twoOptions));
        List<ExamQuestion> sameOptions = questions();
        sameOptions.get(2).setOptions(List.of("mit", "Mit", "bei"));
        sameOptions.get(2).setCorrectAnswer("bei");
        assertNotNull(DtzLetterGapValidator.check(text, sameOptions));
        List<ExamQuestion> badAnswer = questions();
        badAnswer.get(3).setCorrectAnswer("irgendwas");
        assertNotNull(DtzLetterGapValidator.check(text, badAnswer));
        List<ExamQuestion> notChoice = questions();
        notChoice.get(4).setTaskType(ExamTaskType.TRUE_FALSE);
        assertNotNull(DtzLetterGapValidator.check(text, notChoice));
    }
}
