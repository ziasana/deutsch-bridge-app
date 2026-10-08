package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;

import java.util.List;
import java.util.Optional;

/**
 * Registry of the exam parts the import / generator pipeline understands. To add another part or exam
 * (TestDaF Leseverstehen, Goethe Teil 2 ...), add a spec here and, if its shape differs from
 * "match N texts to M headings" or "one text + N multiple-choice questions", a matching validator branch - nothing else in the pipeline changes.
 */
public final class ExamContentSpecs {

    public static final String SCHEMA_VERSION = "1.0";

    private static final List<ExamContentSpec> SPECS = List.of(
            new ExamContentSpec(
                    ExamType.TELC, LearningLevel.B1, ExamSection.LESEVERSTEHEN, 1, ExamTaskType.MATCHING,
                    10, 5, 40, 80,
                    "Lesen Sie die fünf Texte. Welche Überschrift passt zu welchem Text? Eine Überschrift passt nicht.",
                    "exam-content/prompts/matching-headings.v1.0.txt",
                    "1.0"),
            new ExamContentSpec(
                    ExamType.TELC, LearningLevel.B1, ExamSection.LESEVERSTEHEN, 2, ExamTaskType.MULTIPLE_CHOICE,
                    0, 0, 350, 550,
                    "Lesen Sie den Text und die Aufgaben 6 bis 10. Wählen Sie bei jeder Aufgabe die richtige Lösung.",
                    "exam-content/prompts/multiple-choice-reading.v1.0.txt",
                    "1.0",
                    5, 3, 6),
            new ExamContentSpec(
                    ExamType.TELC, LearningLevel.B1, ExamSection.LESEVERSTEHEN, 3, ExamTaskType.SITUATION_MATCHING,
                    0, 0, 0, 0,
                    "Lesen Sie die Situationen 11 bis 20 und die Anzeigen a bis l. Finden Sie für jede Situation die passende Anzeige. "
                            + "Sie können jede Anzeige nur einmal benutzen. Wenn Sie zu einer Situation keine passende Anzeige finden, markieren Sie x.",
                    "exam-content/prompts/situation-matching-ads.v1.0.txt",
                    "1.0",
                    10, 12, 11),
            new ExamContentSpec(
                    ExamType.TELC, LearningLevel.B1, ExamSection.SPRACHBAUSTEINE, 1, ExamTaskType.MULTIPLE_CHOICE,
                    0, 0, 120, 220,
                    "Lesen Sie den Text und schließen Sie die Lücken 21–30. Welche Lösung (a, b oder c) ist jeweils richtig? "
                            + "Markieren Sie Ihre Lösungen für die Aufgaben 21–30 auf dem Antwortbogen.",
                    "exam-content/prompts/sprachbausteine-gaps.v1.0.txt",
                    "1.0",
                    10, 3, 21),
            new ExamContentSpec(
                    ExamType.TELC, LearningLevel.B1, ExamSection.SPRACHBAUSTEINE, 2, ExamTaskType.WORD_BANK_CLOZE,
                    0, 0, 120, 220,
                    "Jedes Wort passt nur einmal. Markieren Sie Ihre Lösungen für die Aufgaben 31–40 auf dem Antwortbogen. "
                            + "Lesen Sie den Text und schließen Sie die Lücken 31–40. Benutzen Sie die Wörter a–o.",
                    "exam-content/prompts/sprachbausteine-wordbank.v1.0.txt",
                    "1.0",
                    10, 15, 31)
    );

    private ExamContentSpecs() {
    }

    public static List<ExamContentSpec> all() {
        return SPECS;
    }

    public static Optional<ExamContentSpec> find(ExamType examType, LearningLevel level, ExamSection section, int part) {
        return SPECS.stream().filter(s -> s.matches(examType, level, section, part)).findFirst();
    }
}
