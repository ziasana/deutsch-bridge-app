package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.DuplicateMatch;
import com.deutschbridge.backend.model.enums.ExamType;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.deutschbridge.backend.service.examcontent.ExamContentTestData.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamDuplicateDetectorTest {

    private final ExamContentValidator validator = new ExamContentValidator();
    private final ExamDuplicateDetector detector = new ExamDuplicateDetector();

    private ParsedExercise parse(String externalId, int seed) {
        return validator.validate(batch(exercise(externalId, seed))).exercises().get(0);
    }

    private static String hash(ParsedExercise ex) {
        return ExamContentFingerprint.hashTexts(ex.texts().stream().map(ParsedExercise.Text::content).toList());
    }

    @Test
    void normalisationFoldsCaseUmlautsAndPunctuation() {
        assertEquals(TextSimilarity.normalize("Die Straße!"), TextSimilarity.normalize("die   STRASSE"));
        assertEquals(1.0, TextSimilarity.similarity("Am Samstag gibt es einen Tauschmarkt.", "am samstag gibt es einen tauschmarkt"));
    }

    @Test
    void storedHtmlAndImportedPlainTextNormaliseAlike() {
        assertEquals(TextSimilarity.normalize("Viele Schüler lesen Bücher."), TextSimilarity.normalize("<p>Viele Sch&uuml;ler lesen B&uuml;cher.</p>"));
        assertEquals(
                ExamContentFingerprint.hashTexts(List.of("Äpfel und Birnen")),
                ExamContentFingerprint.hash(List.of(new com.deutschbridge.backend.model.entity.ExamPassage(null, "Text 1", "<p>&Auml;pfel und Birnen</p>", null, null, null))));
    }

    @Test
    void tauschmarktParaphraseIsMoreSimilarThanUnrelatedText() {
        double close = TextSimilarity.similarity(
                "Am Wochenende findet auf dem Rathausplatz ein Tauschmarkt statt. Hier wird nicht verkauft, sondern getauscht.",
                "Am Samstag gibt es auf dem Rathausplatz einen Tauschmarkt. Hier wird nichts verkauft, man tauscht Dinge.");
        double far = TextSimilarity.similarity(
                "Am Wochenende findet auf dem Rathausplatz ein Tauschmarkt statt. Hier wird nicht verkauft, sondern getauscht.",
                "Die Arztpraxis bleibt wegen einer Fortbildung am Donnerstag geschlossen. Bitte vereinbaren Sie einen neuen Termin.");
        assertTrue(close > far + 0.15, close + " vs " + far);
        assertTrue(close >= ExamDuplicateDetector.SIMILAR_THRESHOLD, "close=" + close);
    }

    @Test
    void sameTextsInAnyOrderAreAnExactDuplicate() {
        ParsedExercise stored = parse("B1-L1-001", 1);
        ParsedExercise again = parse("B1-L1-002", 1);
        var candidate = ExamDuplicateDetector.Candidate.of(stored, ExamType.TELC, hash(stored));
        List<DuplicateMatch> matches = detector.detect(again, ExamType.TELC, hash(again), List.of(candidate));
        assertTrue(matches.stream().anyMatch(m -> m.kind().equals("BATCH_EXACT")));
    }

    @Test
    void unrelatedExerciseHasNoMatches() {
        ParsedExercise a = parse("B1-L1-001", 1);
        ParsedExercise b = parse("B1-L1-002", 2);
        var candidate = ExamDuplicateDetector.Candidate.of(a, ExamType.TELC, hash(a));
        assertTrue(detector.detect(b, ExamType.TELC, hash(b), List.of(candidate)).isEmpty());
    }

    @Test
    void lightlyEditedTextIsReportedAsSimilar() {
        ParsedExercise a = parse("B1-L1-001", 1);
        var edited = validator.validate(batch(exercise("B1-L1-002", 1))).exercises().get(0);
        var texts = new java.util.ArrayList<>(edited.texts());
        texts.set(0, new ParsedExercise.Text("text_1", edited.texts().get(0).content().replaceFirst("^\\S+", "ganzanders"), "e"));
        ParsedExercise changed = new ParsedExercise(1, edited.spec(), "B1-L1-002", edited.title(), edited.instructions(),
                edited.headings(), texts, edited.metadata());
        var candidate = ExamDuplicateDetector.Candidate.of(a, ExamType.TELC, hash(a));
        var matches = detector.detect(changed, ExamType.TELC, hash(changed), List.of(candidate));
        assertTrue(matches.stream().anyMatch(m -> m.kind().equals("BATCH_SIMILAR") && m.similarity() > 0.9));
    }
}
