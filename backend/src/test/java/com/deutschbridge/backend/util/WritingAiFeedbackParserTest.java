package com.deutschbridge.backend.util;

import com.deutschbridge.backend.model.dto.WritingAiFeedback;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class WritingAiFeedbackParserTest {

    @Test
    @DisplayName("parses every key, including a grammar fix with explanation")
    void parsesAllKeys() {
        WritingAiFeedback f = WritingAiFeedbackParser.parse("""
                POSITIVE|Klare Anrede.
                MISSING|Du beantwortest nicht, wann ihr euch trefft.
                GRAMMAR|weil ich muss arbeiten => weil ich arbeiten muss | Verb am Ende
                VOCAB|Nutze "außerdem".
                STRUCTURE|Schreibe einen Schlusssatz.
                EXAMPLE|Leider kann ich nicht kommen, weil ich arbeiten muss.
                """);
        assertEquals(1, f.positives().size());
        assertEquals(1, f.missingPoints().size());
        assertEquals("weil ich arbeiten muss", f.grammar().get(0).corrected());
        assertEquals("Verb am Ende", f.grammar().get(0).explanation());
        assertEquals(1, f.vocabulary().size());
        assertEquals(1, f.structure().size());
        assertNotNull(f.improvementExample());
    }

    @Test
    @DisplayName("caps lists, skips '-' placeholders, malformed grammar lines and unknown keys")
    void toleratesNoise() {
        StringBuilder raw = new StringBuilder("Einleitung ohne Trenner\nMISSING|-\nFOO|bar\nGRAMMAR|kein Pfeil\n");
        for (int i = 0; i < 8; i++) raw.append("POSITIVE|p").append(i).append("\n");
        for (int i = 0; i < 9; i++) raw.append("GRAMMAR|a").append(i).append(" => b").append(i).append("\n");

        WritingAiFeedback f = WritingAiFeedbackParser.parse(raw.toString());

        assertEquals(3, f.positives().size());
        assertTrue(f.missingPoints().isEmpty());
        assertEquals(5, f.grammar().size());
        assertEquals("", f.grammar().get(0).explanation());
    }

    @Test
    @DisplayName("an answer without any usable line is empty")
    void emptyAnswer() {
        assertTrue(WritingAiFeedbackParser.parse("Ich kann dabei leider nicht helfen.").isEmpty());
        assertTrue(WritingAiFeedbackParser.parse(null).isEmpty());
    }
}
