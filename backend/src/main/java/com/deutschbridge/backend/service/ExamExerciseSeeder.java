package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import org.slf4j.Logger;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Static fixture data (no AI generation) so the student-facing attempt/scoring flow can be
 * demoed and tested before the admin authoring UI is used for real content.
 */
@Component
public class ExamExerciseSeeder {

    private final Logger log;

    public ExamExerciseSeeder(Logger log) {
        this.log = log;
    }

    @Bean
    public CommandLineRunner seedExamExercises(ExamExerciseRepository repository) {
        return args -> {
            if (repository.count() > 0) return;

            repository.save(multipleChoiceExercise());
            repository.save(matchingExercise());
            repository.save(trueFalseNotGivenExercise());

            log.info("Seeded 3 exam exercises!");
        };
    }

    private ExamExercise multipleChoiceExercise() {
        ExamPassage passage = passage("Text", """
                Immer mehr Unternehmen in Deutschland bieten ihren Mitarbeitenden die Möglichkeit, \
                im Homeoffice zu arbeiten. Laut einer aktuellen Studie arbeiten inzwischen fast 30 \
                Prozent der Beschäftigten zumindest teilweise von zu Hause aus. Befürworter loben \
                die Flexibilität und die eingesparte Pendelzeit. Kritiker warnen jedoch davor, dass \
                der persönliche Kontakt zu Kolleginnen und Kollegen leiden könnte und dass sich \
                Arbeit und Freizeit im Homeoffice schwerer trennen lassen. Viele Firmen setzen \
                deshalb inzwischen auf ein hybrides Modell: einige Tage im Büro, einige Tage zu Hause.
                """);

        ExamQuestion q1 = question(ExamTaskType.MULTIPLE_CHOICE,
                "Wie viele Beschäftigte arbeiten laut der Studie zumindest teilweise von zu Hause?",
                List.of("Fast 30 Prozent", "Über 50 Prozent", "Weniger als 10 Prozent"),
                "Fast 30 Prozent",
                "Die Prozentzahl steht direkt im Text - suche nach der Zahl und dem Wort 'Prozent' und lies den ganzen Satz, nicht nur die Zahl isoliert.",
                "Ein häufiger Fehler ist, eine andere im Text genannte Zahl zu wählen, ohne genau zu prüfen, worauf sie sich bezieht.");

        ExamQuestion q2 = question(ExamTaskType.MULTIPLE_CHOICE,
                "Was kritisieren Gegner des Homeoffice laut dem Text?",
                List.of(
                        "Dass die Mitarbeitenden weniger verdienen",
                        "Dass der Kontakt zu Kollegen leiden könnte und Arbeit und Freizeit schwerer zu trennen sind",
                        "Dass Homeoffice gesetzlich verboten werden sollte"),
                "Dass der Kontakt zu Kollegen leiden könnte und Arbeit und Freizeit schwerer zu trennen sind",
                "Achte auf Signalwörter wie 'Kritiker warnen jedoch' - danach folgt meist die Gegenposition, die du für diese Frage brauchst.",
                "Verwechsle nicht die Vorteile (Flexibilität, gesparte Pendelzeit), die im Satz davor stehen, mit den genannten Nachteilen.");

        ExamQuestion q3 = question(ExamTaskType.MULTIPLE_CHOICE,
                "Welches Modell setzen viele Firmen laut dem Text inzwischen um?",
                List.of("Ausschließlich Büroarbeit", "Ein hybrides Modell mit Büro- und Homeoffice-Tagen", "Ausschließlich Homeoffice"),
                "Ein hybrides Modell mit Büro- und Homeoffice-Tagen",
                "Der letzte Satz des Textes fasst oft die Schlussfolgerung zusammen - lies ihn besonders sorgfältig.",
                "Ein typischer Fehler ist, nur einen Teil des Kompromisses (z.B. nur 'Homeoffice') als Antwort zu wählen, statt das gesamte hybride Modell zu erkennen.");

        ExamExercise exercise = new ExamExercise();
        exercise.setTitle("Leseverstehen B1 - Homeoffice in Deutschland");
        exercise.setSection(ExamSection.LESEVERSTEHEN);
        exercise.setTaskType(ExamTaskType.MULTIPLE_CHOICE);
        exercise.setLevel(LearningLevel.B1);
        exercise.setPartNumber(2);
        exercise.setPassages(List.of(passage));
        exercise.setQuestions(List.of(q1, q2, q3));
        exercise.setDefaultExplanation("Lies den Abschnitt rund um die relevanten Schlüsselwörter noch einmal genau, bevor du antwortest.");
        exercise.setDefaultCommonMistake("Verwechsle nicht ähnlich klingende Informationen aus benachbarten Sätzen.");
        return exercise;
    }

    /**
     * Real Telc Leseverstehen Teil 1: 5 short texts, and MORE headlines than texts (here 5 correct
     * + 3 distractors) so the pool can't be solved by elimination alone - each headline is used at
     * most once across the whole exercise.
     */
    private ExamExercise matchingExercise() {
        ExamPassage text1 = passage("Text 1", "Der Herbstmarkt in der Innenstadt öffnet an diesem Wochenende erstmals seine Tore. Besucher erwartet ein bunter Mix aus regionalen Produkten, Kunsthandwerk und Live-Musik auf der Hauptbühne.");
        ExamPassage text2 = passage("Text 2", "Ab kommendem Montag gilt auf der Bahnstrecke zwischen den beiden Großstädten ein neuer Fahrplan. Züge fahren nun im 20-Minuten-Takt, wodurch sich die Wartezeiten für Pendler deutlich verkürzen.");
        ExamPassage text3 = passage("Text 3", "Die Stadtbibliothek erweitert ihr Angebot um einen digitalen Leseausweis. Nutzer können damit E-Books und Hörbücher direkt auf ihr Smartphone laden, ohne die Bibliothek besuchen zu müssen.");
        ExamPassage text4 = passage("Text 4", "Ein neues Gesetz verpflichtet Vermieter dazu, energetische Sanierungen innerhalb der nächsten fünf Jahre umzusetzen. Ziel ist es, den Energieverbrauch von Wohngebäuden deutlich zu senken.");
        ExamPassage text5 = passage("Text 5", "Der örtliche Sportverein sucht dringend ehrenamtliche Trainer für die Jugendmannschaften. Interessierte können sich ab sofort per E-Mail beim Vorstand melden.");

        String correctFor1 = "Regionales und Musik zum Start ins Wochenende";
        String correctFor2 = "Kürzere Wartezeiten für Berufstätige";
        String correctFor3 = "Mehr Bücher, weniger Wege";
        String correctFor4 = "Neue Pflicht für Hauseigentümer";
        String correctFor5 = "Ehrenamt im Jugendsport gesucht";

        List<String> answerOptions = List.of(
                correctFor1,
                correctFor2,
                correctFor3,
                correctFor4,
                correctFor5,
                "Neue Öffnungszeiten im Rathaus",
                "Stadtverwaltung warnt vor Trickbetrügern",
                "Mehr Grünflächen für die Innenstadt geplant"
        );

        ExamQuestion q1 = matchingQuestion(0, correctFor1);
        ExamQuestion q2 = matchingQuestion(1, correctFor2);
        ExamQuestion q3 = matchingQuestion(2, correctFor3);
        ExamQuestion q4 = matchingQuestion(3, correctFor4);
        ExamQuestion q5 = matchingQuestion(4, correctFor5);

        ExamExercise exercise = new ExamExercise();
        exercise.setTitle("Leseverstehen B1 - Überschriften zuordnen");
        exercise.setSection(ExamSection.LESEVERSTEHEN);
        exercise.setTaskType(ExamTaskType.MATCHING);
        exercise.setLevel(LearningLevel.B1);
        exercise.setPartNumber(1);
        exercise.setPassages(List.of(text1, text2, text3, text4, text5));
        exercise.setQuestions(List.of(q1, q2, q3, q4, q5));
        exercise.setAnswerOptions(answerOptions);
        exercise.setDefaultExplanation("Suche im Text nach Wörtern, die dasselbe wie die Überschrift bedeuten, auch wenn sie anders formuliert sind (Synonyme). Nicht jede Überschrift passt zu einem Text - manche sind absichtliche Distraktoren.");
        exercise.setDefaultCommonMistake("Ordne nicht nach einem einzelnen auffälligen Wort zu - lies den ganzen Text, da manche Überschriften ähnliche Schlüsselwörter wie der Text verwenden, ohne inhaltlich zu passen.");
        return exercise;
    }

    private ExamExercise trueFalseNotGivenExercise() {
        ExamPassage ad1 = passage("Anzeige 1", "Gemütliche 2-Zimmer-Wohnung im Zentrum zu vermieten. 55 m², Balkon, Einbauküche. Kaltmiete 650 Euro zzgl. Nebenkosten. Haustiere nach Absprache erlaubt.");
        ExamPassage ad2 = passage("Anzeige 2", "Suche zuverlässige Nachhilfelehrerin für Mathematik, Klasse 8. Zweimal wöchentlich, nachmittags. Bezahlung nach Vereinbarung. Erfahrung erwünscht, aber kein Muss.");
        ExamPassage ad3 = passage("Anzeige 3", "Gebrauchtes Fahrrad, Damenrad, 28 Zoll, guter Zustand, neue Bremsen. Abholung nur am Wochenende möglich. Preis: 120 Euro, Festpreis, kein Versand.");

        ExamQuestion q1 = tfnQuestion(0, "Die Wohnung kostet 650 Euro inklusive Nebenkosten.", "FALSCH",
                "Vergleiche genau: 'Kaltmiete 650 Euro zzgl. Nebenkosten' bedeutet, dass die Nebenkosten noch dazukommen, also nicht inklusive sind.",
                "Ein häufiger Fehler ist, 'zzgl.' (zuzüglich) mit 'inklusive' zu verwechseln.");
        ExamQuestion q2 = tfnQuestion(1, "Für die Nachhilfe ist Berufserfahrung zwingend erforderlich.", "FALSCH",
                "Der Text sagt 'erwünscht, aber kein Muss' - das bedeutet, es ist nicht zwingend notwendig.",
                "Nicht jede erwähnte Vorliebe ('erwünscht') ist eine Pflicht - achte auf einschränkende Zusätze wie 'kein Muss'.");
        ExamQuestion q3 = tfnQuestion(2, "Das Fahrrad kann auch unter der Woche abgeholt werden.", "FALSCH",
                "Im Text steht ausdrücklich 'Abholung nur am Wochenende möglich' - das schließt die Woche aus.",
                "Achte auf einschränkende Wörter wie 'nur', die den Geltungsbereich einer Aussage stark verändern.");
        ExamQuestion q4 = tfnQuestion(2, "Der Verkäufer verschickt das Fahrrad auch per Post.", "FALSCH",
                "Der Text nennt ausdrücklich 'kein Versand' - das Gegenteil der Aussage ist also richtig.",
                "Verwechsle 'kein Versand' nicht mit einer fehlenden Information - hier wird aktiv verneint.");
        ExamQuestion q5 = tfnQuestion(1, "Die Nachhilfelehrerin muss auch am Wochenende verfügbar sein.", "NICHT_IM_TEXT",
                "Der Text nennt nur 'zweimal wöchentlich, nachmittags', aber keine Aussage zum Wochenende - daher ist die Information nicht im Text enthalten.",
                "Verwechsle 'nicht im Text' nicht mit 'falsch' - wenn etwas einfach nicht erwähnt wird, ist es NICHT_IM_TEXT, nicht FALSCH.");

        ExamExercise exercise = new ExamExercise();
        exercise.setTitle("Leseverstehen B1 - Kleinanzeigen: Richtig, Falsch oder Nicht im Text?");
        exercise.setSection(ExamSection.LESEVERSTEHEN);
        exercise.setTaskType(ExamTaskType.TRUE_FALSE_NOT_GIVEN);
        exercise.setLevel(LearningLevel.B1);
        exercise.setPartNumber(3);
        exercise.setPassages(List.of(ad1, ad2, ad3));
        exercise.setQuestions(List.of(q1, q2, q3, q4, q5));
        exercise.setDefaultExplanation("Vergleiche die Aussage Wort für Wort mit dem Text: steht das Gegenteil da, ist sie FALSCH; steht dazu gar nichts im Text, ist sie NICHT_IM_TEXT.");
        exercise.setDefaultCommonMistake("NICHT_IM_TEXT wird oft fälschlich mit FALSCH verwechselt, obwohl der Text die Aussage gar nicht erwähnt.");
        return exercise;
    }

    private ExamPassage passage(String label, String content) {
        ExamPassage passage = new ExamPassage(null, label, content.strip(), null);
        return passage.ensureId();
    }

    private ExamQuestion question(ExamTaskType taskType, String prompt, List<String> options, String correctAnswer,
                                   String explanation, String commonMistake) {
        ExamQuestion question = new ExamQuestion(
                null, taskType, prompt, null, options, correctAnswer, explanation, commonMistake
        );
        return question.ensureId();
    }

    private ExamQuestion matchingQuestion(int passageIndex, String correctHeadline) {
        ExamQuestion question = new ExamQuestion(
                null, ExamTaskType.MATCHING, "Welche Überschrift passt zu diesem Text?", passageIndex, null, correctHeadline,
                "Achte auf Synonyme: die Überschrift nutzt oft andere Wörter als der Text, meint aber dasselbe.",
                "Ordne nicht nach nur einem auffälligen Wort zu, sondern lies den gesamten Textabschnitt - manche Distraktoren enthalten ähnliche Schlüsselwörter."
        );
        return question.ensureId();
    }

    private ExamQuestion tfnQuestion(int sectionIndex, String statement, String correctAnswer,
                                      String explanation, String commonMistake) {
        ExamQuestion question = new ExamQuestion(
                null, ExamTaskType.TRUE_FALSE_NOT_GIVEN, statement, sectionIndex, null, correctAnswer,
                explanation, commonMistake
        );
        return question.ensureId();
    }
}
