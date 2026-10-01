package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.WritingFeedback;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class WritingFeedbackAnalyzerTest {

    private final WritingFeedbackAnalyzer analyzer = new WritingFeedbackAnalyzer();
    private static final List<String> LEITPUNKTE = List.of("Warum können Sie nicht kommen?", "Wann können Sie sich treffen?");
    private static final List<String> PHRASES = List.of("Vielen Dank für deine Einladung.", "Außerdem …");

    private WritingFeedback.Dimension dim(WritingFeedback f, String key) {
        return f.dimensions().stream().filter(d -> d.key().equals(key)).findFirst().orElseThrow();
    }

    @Test
    @DisplayName("a short text without greeting, closing or Leitpunkte gets task and structure improvements")
    void weakText() {
        WritingFeedback f = analyzer.analyze("Ich kann nicht kommen.", LearningLevel.B1, LEITPUNKTE, PHRASES);

        assertEquals("IMPROVE", dim(f, "TASK").status());
        assertTrue(dim(f, "TASK").improvements().stream().anyMatch(i -> i.contains("kurz")));
        assertTrue(dim(f, "STRUCTURE").improvements().stream().anyMatch(i -> i.contains("Anrede")));
        assertTrue(dim(f, "STRUCTURE").improvements().stream().anyMatch(i -> i.contains("Grußformel")));
        assertEquals("NOT_ASSESSED", dim(f, "LANGUAGE").status());
        assertFalse(f.nextFocus().isEmpty());
        assertTrue(f.nextFocus().size() <= 3);
    }

    @Test
    @DisplayName("a well-formed text earns positives for greeting, closing, connectors and phrases")
    void goodText() {
        String text = """
                Liebe Anna,

                Vielen Dank für deine Einladung. Leider kann ich am Samstag nicht kommen, weil ich arbeiten muss.
                Deshalb möchte ich dir einen anderen Termin vorschlagen.

                Wir können uns am Sonntag treffen, aber nur am Nachmittag. Außerdem könnten wir zusammen ins Kino gehen,
                denn ich habe lange keinen Film gesehen. Ich glaube, dass dir das gefallen würde.

                Liebe Grüße
                Mohammad
                """;
        WritingFeedback f = analyzer.analyze(text, LearningLevel.A2, List.of("Warum können Sie nicht kommen?"), PHRASES);

        assertTrue(dim(f, "STRUCTURE").positives().stream().anyMatch(p -> p.contains("Anrede")));
        assertTrue(dim(f, "STRUCTURE").positives().stream().anyMatch(p -> p.contains("Grußformel")));
        assertTrue(dim(f, "STRUCTURE").positives().stream().anyMatch(p -> p.contains("Verbindungswörter")));
        assertTrue(f.stats().usedPhrases().contains("Vielen Dank für deine Einladung"));
        assertTrue(f.stats().uncoveredLeitpunkte().isEmpty());
    }

    @Test
    @DisplayName("formal greeting mixed with 'du' is flagged")
    void formalityMix() {
        WritingFeedback f = analyzer.analyze("Sehr geehrte Frau Müller,\n\nich schreibe dir, weil ich dein Angebot gesehen habe.\n\nMit freundlichen Grüßen\nAli",
                LearningLevel.B1, List.of(), List.of());
        assertTrue(dim(f, "STRUCTURE").improvements().stream().anyMatch(i -> i.contains("Sie")));
    }

    @Test
    @DisplayName("lowercase sentence starts are reported under formal correctness")
    void lowercaseSentences() {
        WritingFeedback f = analyzer.analyze("Liebe Anna, ich komme. morgen habe ich Zeit.", LearningLevel.A2, List.of(), List.of());
        assertTrue(dim(f, "FORM").improvements().stream().anyMatch(i -> i.contains("Großbuchstaben")));
    }
}
