package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.RedemittelExerciseDto;
import com.deutschbridge.backend.model.entity.RedemittelExercise;
import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.RedemittelExerciseType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

class RedemittelExerciseFactoryTest {

    private static final java.util.List<String> LABELS = com.deutschbridge.backend.RedemittelTestFunctions.LABELS.values().stream().toList();
    private final RedemittelExerciseFactory factory = new RedemittelExerciseFactory(new Random(7));

    private final WritingPhrase phrase = phrase();

    private static WritingPhrase phrase() {
        WritingPhrase p = new WritingPhrase();
        p.setId("p1");
        p.setPhrase("Ich bin der Meinung, dass …");
        return p;
    }

    private RedemittelExercise exercise(RedemittelExerciseType type, String prompt, String correct, String wrong) {
        RedemittelExercise e = new RedemittelExercise();
        e.setId("e1");
        e.setPhraseId("p1");
        e.setType(type);
        e.setPrompt(prompt);
        e.setCorrectAnswer(correct);
        e.setWrongAnswers(wrong);
        return e;
    }

    @Test
    @DisplayName("core -> keeps the first alternative and drops the trailing ellipsis")
    void core() {
        assertEquals("Ich bin der Meinung, dass", RedemittelExerciseFactory.core("Ich bin der Meinung, dass …"));
        assertEquals("Sehr geehrte Frau Müller,", RedemittelExerciseFactory.core("Sehr geehrte Frau Müller, / Sehr geehrter Herr Schmidt,"));
        assertEquals("Wie wäre es mit", RedemittelExerciseFactory.core("Wie wäre es mit …?"));
        assertEquals("Könnten Sie mir sagen,", RedemittelExerciseFactory.core("Könnten Sie mir sagen, …?"));
        assertEquals("Wie geht es dir?", RedemittelExerciseFactory.core("Wie geht es dir?"));
        assertEquals("Vielen Dank für deine Nachricht.", RedemittelExerciseFactory.core("Vielen Dank für deine Nachricht."));
    }

    @Test
    @DisplayName("meaning -> uses the authored answers only, shuffled, with the default question when no prompt is set")
    void meaning() {
        RedemittelExercise ex = exercise(RedemittelExerciseType.MEANING, null, "I think that …", "I am sorry\nI agree");
        RedemittelExerciseDto dto = factory.toDto(ex, phrase);
        assertEquals("e1", dto.exerciseId());
        assertEquals("Was bedeutet: „Ich bin der Meinung, dass“", dto.prompt());
        assertEquals(3, dto.options().size());
        assertTrue(dto.options().stream().anyMatch(o -> o.text().equals("I think that …")));
        assertTrue(dto.options().stream().anyMatch(o -> o.text().equals("I agree")));
        assertTrue(factory.isCorrect(ex, " i think that … "));
        assertFalse(factory.isCorrect(ex, "I agree"));
    }

    @Test
    @DisplayName("meaning -> an authored prompt wins over the default question")
    void meaningPrompt() {
        RedemittelExercise ex = exercise(RedemittelExerciseType.MEANING, "Was heißt das auf Englisch?", "a", "b\nc");
        assertEquals("Was heißt das auf Englisch?", factory.toDto(ex, phrase).prompt());
    }

    @Test
    @DisplayName("situation -> shows the authored situation and grades the chosen expression")
    void situation() {
        RedemittelExercise ex = exercise(RedemittelExerciseType.SITUATION, "Du stimmst zu.\n\nWelches Redemittel passt?", "Da bin ich ganz deiner Meinung.", "Das möchte ich nicht beantworten.\nEntschuldigen Sie die Verspätung.");
        RedemittelExerciseDto dto = factory.toDto(ex, phrase);
        assertTrue(dto.prompt().startsWith("Du stimmst zu."));
        assertEquals(3, dto.options().size());
        assertTrue(factory.isCorrect(ex, "Da bin ich ganz deiner Meinung."));
        assertFalse(factory.isCorrect(ex, "Das möchte ich nicht beantworten."));
    }

    @Test
    @DisplayName("fill blank -> shows the authored sentence and accepts the word regardless of case and punctuation")
    void fillBlank() {
        RedemittelExercise ex = exercise(RedemittelExerciseType.FILL_BLANK, "Ich bin der ________, dass Busse billiger sein sollten.", "Meinung", null);
        RedemittelExerciseDto dto = factory.toDto(ex, phrase);
        assertNull(dto.options());
        assertTrue(dto.prompt().contains("Ich bin der ________, dass Busse billiger sein sollten."));
        assertTrue(factory.isCorrect(ex, " meinung. "));
        assertFalse(factory.isCorrect(ex, "Ansicht"));
        assertFalse(factory.isCorrect(ex, " "));
    }

    @Test
    @DisplayName("production -> topic is the authored prompt, the expression is shown, any sentence counts")
    void production() {
        RedemittelExercise ex = exercise(RedemittelExerciseType.PRODUCTION, "Sollten Kinder weniger Zeit am Smartphone verbringen?", null, null);
        RedemittelExerciseDto dto = factory.toDto(ex, phrase);
        assertEquals("Sollten Kinder weniger Zeit am Smartphone verbringen?", dto.topic());
        assertEquals("Ich bin der Meinung, dass", dto.phrase());
        assertTrue(factory.isCorrect(ex, "Ich bin der Meinung, dass Sport wichtig ist."));
        assertFalse(factory.isCorrect(ex, ""));
        assertEquals("Ich bin der Meinung, dass …", factory.modelAnswer(phrase));
        phrase.setExample("Ich bin der Meinung, dass Busse billiger sein sollten.");
        assertEquals("Ich bin der Meinung, dass Busse billiger sein sollten.", factory.modelAnswer(phrase));
    }

    // ---- derived ----

    private WritingPhrase withExample() {
        WritingPhrase p = phrase();
        p.setCategory(com.deutschbridge.backend.RedemittelTestFunctions.of("OPINION"));
        p.setExample("Ich bin der Meinung, dass Busse billiger sein sollten.");
        return p;
    }

    @Test
    @DisplayName("function quiz -> always possible; the options are category labels and the right one is graded")
    void function() {
        WritingPhrase p = withExample();
        p.setExample(null);
        RedemittelExerciseDto dto = factory.derive(RedemittelExerciseType.FUNCTION, p, LABELS).orElseThrow();
        assertEquals("auto:FUNCTION", dto.exerciseId());
        assertEquals(3, dto.options().size());
        assertTrue(dto.options().stream().anyMatch(o -> o.text().equals("Meinung äußern")));
        assertTrue(factory.isCorrectDerived(RedemittelExerciseType.FUNCTION, p, "Meinung äußern"));
        assertFalse(factory.isCorrectDerived(RedemittelExerciseType.FUNCTION, p, "Begründen"));
    }

    @Test
    @DisplayName("cloze -> blanks the phrase inside the example sentence and accepts the phrase")
    void cloze() {
        WritingPhrase p = withExample();
        RedemittelExerciseDto dto = factory.derive(RedemittelExerciseType.CLOZE, p, LABELS).orElseThrow();
        assertTrue(dto.prompt().contains("________ Busse billiger sein sollten."));
        assertFalse(dto.prompt().split("Funktion")[0].contains("Meinung"));
        assertTrue(dto.prompt().contains("Funktion: Meinung äußern"));
        assertTrue(factory.isCorrectDerived(RedemittelExerciseType.CLOZE, p, " Ich bin der Meinung, dass "));
        assertFalse(factory.isCorrectDerived(RedemittelExerciseType.CLOZE, p, "Ich denke, dass"));
    }

    @Test
    @DisplayName("cloze and word order -> not offered without an example, or when it does not contain the phrase / is too short")
    void derivedEligibility() {
        WritingPhrase none = withExample();
        none.setExample(null);
        assertTrue(factory.derive(RedemittelExerciseType.CLOZE, none, LABELS).isEmpty());
        assertTrue(factory.derive(RedemittelExerciseType.WORD_ORDER, none, LABELS).isEmpty());

        WritingPhrase unrelated = withExample();
        unrelated.setExample("Das ist ein ganz anderer Satz hier.");
        assertTrue(factory.derive(RedemittelExerciseType.CLOZE, unrelated, LABELS).isEmpty());
        assertTrue(factory.derive(RedemittelExerciseType.WORD_ORDER, unrelated, LABELS).isPresent());

        WritingPhrase tiny = withExample();
        tiny.setExample("Zu kurz hier");
        assertTrue(factory.derive(RedemittelExerciseType.WORD_ORDER, tiny, LABELS).isEmpty());
    }

    @Test
    @DisplayName("word order -> shuffled words of the example; only the exact order is correct")
    void wordOrder() {
        WritingPhrase p = withExample();
        RedemittelExerciseDto dto = factory.derive(RedemittelExerciseType.WORD_ORDER, p, LABELS).orElseThrow();
        String original = p.getExample();
        assertEquals(9, dto.options().size());
        assertNotEquals(original, String.join(" ", dto.options().stream().map(RedemittelExerciseDto.Option::text).toList()));
        assertEquals(original.length(), String.join(" ", dto.options().stream().map(RedemittelExerciseDto.Option::text).toList()).length());
        assertTrue(factory.isCorrectDerived(RedemittelExerciseType.WORD_ORDER, p, original));
        assertTrue(factory.isCorrectDerived(RedemittelExerciseType.WORD_ORDER, p, "  " + original.replace(" ", "  ") + " "));
        assertFalse(factory.isCorrectDerived(RedemittelExerciseType.WORD_ORDER, p, "billiger sein sollten Busse Ich bin der Meinung, dass"));
    }

    @Test
    @DisplayName("autoType -> parses derived ids only")
    void autoType() {
        assertEquals(java.util.Optional.of(RedemittelExerciseType.CLOZE), RedemittelExerciseFactory.autoType("auto:CLOZE"));
        assertEquals(java.util.Optional.empty(), RedemittelExerciseFactory.autoType("auto:MEANING"));
        assertEquals(java.util.Optional.empty(), RedemittelExerciseFactory.autoType("auto:NOPE"));
        assertEquals(java.util.Optional.empty(), RedemittelExerciseFactory.autoType("abc123"));
    }
}
