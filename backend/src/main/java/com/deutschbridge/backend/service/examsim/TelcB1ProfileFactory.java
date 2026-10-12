package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.dto.examsim.ExamProfileRequest;
import com.deutschbridge.backend.model.enums.AnswerReleasePolicy;
import com.deutschbridge.backend.model.enums.ExamPartModule;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTimerKind;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.OverallResultPolicy;
import com.deutschbridge.backend.model.enums.PartScoringMethod;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.ExamProfileConfig;
import com.deutschbridge.backend.model.examsim.ExamTimerConfig;
import com.deutschbridge.backend.model.examsim.RubricCriterion;

import java.math.BigDecimal;
import java.util.List;

/**
 * The initial telc B1 configuration (300 points: 225 written + 75 oral) as plain data. It is only a seed value for the
 * generic profile model; nothing in the scoring or lifecycle code refers to it.
 */
public final class TelcB1ProfileFactory {

    public static final String CODE = "TELC_B1_FULL";

    private TelcB1ProfileFactory() {
    }

    public static ExamProfileRequest request() {
        List<ExamTimerConfig> timers = List.of(
                new ExamTimerConfig("LESEN_SPRACHBAUSTEINE", "Leseverstehen und Sprachbausteine", 90, ExamTimerKind.WORKING, null),
                new ExamTimerConfig("HOEREN", "Hörverstehen", 30, ExamTimerKind.WORKING, null),
                new ExamTimerConfig("SCHREIBEN", "Schriftlicher Ausdruck", 30, ExamTimerKind.WORKING, null),
                new ExamTimerConfig("MUENDLICH_VORBEREITUNG", "Mündlich: Vorbereitung", 20, ExamTimerKind.PREPARATION, "MUENDLICH"),
                new ExamTimerConfig("MUENDLICH", "Mündlicher Ausdruck (Übung)", 15, ExamTimerKind.WORKING, null));

        RubricCriterion[] writing = {
                new RubricCriterion("AUFGABENERFUELLUNG", "Aufgabenerfüllung", "Inhalt und Leitpunkte der Aufgabe", bd("15")),
                new RubricCriterion("KOMMUNIKATIVE_GESTALTUNG", "Kommunikative Gestaltung", "Textaufbau, Register und Verständlichkeit", bd("15")),
                new RubricCriterion("FORMALE_RICHTIGKEIT", "Formale Richtigkeit", "Grammatik, Wortschatz und Orthografie", bd("15"))};

        List<ExamPartConfig> parts = List.of(
                objective("LESEN_1", "Leseverstehen Teil 1", ExamSection.LESEVERSTEHEN, 1, 5, "5", "25", "LESEN_SPRACHBAUSTEINE"),
                objective("LESEN_2", "Leseverstehen Teil 2", ExamSection.LESEVERSTEHEN, 2, 5, "5", "25", "LESEN_SPRACHBAUSTEINE"),
                objective("LESEN_3", "Leseverstehen Teil 3", ExamSection.LESEVERSTEHEN, 3, 10, "2.5", "25", "LESEN_SPRACHBAUSTEINE"),
                objective("SPRACHBAUSTEINE_1", "Sprachbausteine Teil 1", ExamSection.SPRACHBAUSTEINE, 1, 10, "1.5", "15", "LESEN_SPRACHBAUSTEINE"),
                objective("SPRACHBAUSTEINE_2", "Sprachbausteine Teil 2", ExamSection.SPRACHBAUSTEINE, 2, 10, "1.5", "15", "LESEN_SPRACHBAUSTEINE"),
                objective("HOEREN_1", "Hörverstehen Teil 1", ExamSection.HOERVERSTEHEN, 1, 5, "5", "25", "HOEREN"),
                objective("HOEREN_2", "Hörverstehen Teil 2", ExamSection.HOERVERSTEHEN, 2, 10, "2.5", "25", "HOEREN"),
                objective("HOEREN_3", "Hörverstehen Teil 3", ExamSection.HOERVERSTEHEN, 3, 5, "5", "25", "HOEREN"),
                manual("SCHRIFTLICHER_AUSDRUCK", "Schriftlicher Ausdruck", ExamPartModule.WRITTEN, ExamSection.SCHRIFTLICHER_AUSDRUCK, 1, "45", "SCHREIBEN", List.of(writing)),
                manual("MUENDLICH_1", "Mündlicher Ausdruck Teil 1", ExamPartModule.ORAL, ExamSection.MUENDLICHER_AUSDRUCK, 1, "15", "MUENDLICH",
                        List.of(new RubricCriterion("GESAMT", "Gesamtbewertung Teil 1", null, bd("15")))),
                manual("MUENDLICH_2", "Mündlicher Ausdruck Teil 2", ExamPartModule.ORAL, ExamSection.MUENDLICHER_AUSDRUCK, 2, "30", "MUENDLICH",
                        List.of(new RubricCriterion("GESAMT", "Gesamtbewertung Teil 2", null, bd("30")))),
                manual("MUENDLICH_3", "Mündlicher Ausdruck Teil 3", ExamPartModule.ORAL, ExamSection.MUENDLICHER_AUSDRUCK, 3, "30", "MUENDLICH",
                        List.of(new RubricCriterion("GESAMT", "Gesamtbewertung Teil 3", null, bd("30")))));

        return new ExamProfileRequest(CODE, "telc", "telc Deutsch B1", "telc Deutsch B1 – Gesamtprüfung",
                "Vollständige Prüfungssimulation nach dem telc-B1-Bewertungsmodell: 225 Punkte schriftlich, 75 Punkte mündlich (in V1 nicht bewertet).",
                ExamType.TELC, LearningLevel.B1, false, bd("225"), bd("135"), bd("75"), bd("45"),
                OverallResultPolicy.WRITTEN_AND_ORAL_REQUIRED, AnswerReleasePolicy.AFTER_SUBMISSION, null, false,
                new ExamProfileConfig(parts, timers, 1, "HALF_UP"));
    }

    private static ExamPartConfig objective(String key, String label, ExamSection section, int teil, int questions, String perQuestion, String max, String timer) {
        return new ExamPartConfig(key, label, ExamPartModule.WRITTEN, section, teil, null, 1, questions, bd(perQuestion), bd(max),
                PartScoringMethod.PER_QUESTION, timer, null);
    }

    private static ExamPartConfig manual(String key, String label, ExamPartModule module, ExamSection section, int teil, String max, String timer,
                                         List<RubricCriterion> rubric) {
        return new ExamPartConfig(key, label, module, section, teil, null, 1, null, null, bd(max), PartScoringMethod.MANUAL_RUBRIC, timer, rubric);
    }

    private static BigDecimal bd(String v) {
        return new BigDecimal(v);
    }
}
