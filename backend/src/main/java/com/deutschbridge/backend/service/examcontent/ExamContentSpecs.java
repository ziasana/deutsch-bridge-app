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

    /** Standard hint shown below the task; used when an imported task does not carry its own. */
    public static final String WRITING_GUIDANCE = "Überlegen Sie sich vor dem Schreiben eine passende Reihenfolge der Punkte, "
            + "einen passenden Betreff, eine passende Anrede, Einleitung und einen passenden Schluss.";

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
                    10, 15, 31),
            new ExamContentSpec(
                    ExamType.TELC, LearningLevel.B1, ExamSection.SCHRIFTLICHER_AUSDRUCK, 1, ExamTaskType.WRITING_TASK,
                    0, 0, 100, 150,
                    "Antworten Sie auf die E-Mail. Schreiben Sie etwas zu allen vier Punkten:",
                    "exam-content/prompts/schriftlicher-ausdruck.v1.0.txt",
                    "1.0",
                    4, 0, 1),
            new ExamContentSpec(
                    ExamType.TELC, LearningLevel.B1, ExamSection.MUENDLICHER_AUSDRUCK, 1, ExamTaskType.TOPIC_INTERVIEW,
                    0, 0, 0, 0,
                    "Stellen Sie sich Ihrer Gesprächspartnerin oder Ihrem Gesprächspartner vor und stellen Sie Fragen zu den folgenden Themen. "
                            + "Antworten Sie auch auf die Fragen Ihres Partners.",
                    "exam-content/prompts/muendlicher-ausdruck-teil1.v1.0.txt",
                    "1.0"),
            new ExamContentSpec(
                    ExamType.TELC, LearningLevel.B1, ExamSection.MUENDLICHER_AUSDRUCK, 2, ExamTaskType.OPINION_DISCUSSION,
                    0, 0, 0, 0,
                    "Berichten Sie, was die Person zum Thema denkt. Sagen Sie dann Ihre eigene Meinung, erzählen Sie von Ihren Erfahrungen "
                            + "und reagieren Sie auf die Meinung Ihrer Gesprächspartnerin oder Ihres Gesprächspartners.",
                    "exam-content/prompts/muendlicher-ausdruck-teil2.v1.0.txt",
                    "1.0"),
            new ExamContentSpec(
                    ExamType.TELC, LearningLevel.B1, ExamSection.MUENDLICHER_AUSDRUCK, 3, ExamTaskType.JOINT_PLANNING,
                    0, 0, 0, 0,
                    "Planen Sie gemeinsam mit Ihrer Gesprächspartnerin oder Ihrem Gesprächspartner. Machen Sie Vorschläge, begründen Sie Ihre Meinung, "
                            + "reagieren Sie auf die Vorschläge Ihres Partners und einigen Sie sich auf eine gemeinsame Lösung.",
                    "exam-content/prompts/muendlicher-ausdruck-teil3.v1.0.txt",
                    "1.0")
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
