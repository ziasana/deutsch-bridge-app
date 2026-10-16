import { SpeakingTaskType } from "@/types/exam";
import { LearnSectionMeta } from "../writing/learn/types";

export const SPEAKING_COLOR = "#ec4899";

/** The exams that have a Mündlicher Ausdruck learning area. */
export type SpeakingExam = "TELC" | "DTZ";

/** DTZ A2-B1 exercises and guides are stored at this level. */
export const DTZ_LEVEL = "B1";

export const parseSpeakingExam = (value: string | null | undefined): SpeakingExam => (value === "DTZ" ? "DTZ" : "TELC");

export interface SpeakingPartMeta {
    part: 1 | 2 | 3;
    taskType: SpeakingTaskType | "SELF_INTRODUCTION" | "PHOTO_EXPERIENCE";
    title: string;
    description: string;
}

/** The three Teile of Mündlicher Ausdruck. */
export const SPEAKING_PARTS: SpeakingPartMeta[] = [
    { part: 1, taskType: "TOPIC_INTERVIEW", title: "Einander kennenlernen", description: "Sich vorstellen, Fragen stellen und beantworten." },
    { part: 2, taskType: "OPINION_DISCUSSION", title: "Über ein Thema sprechen", description: "Meinungen wiedergeben, eigene Meinung und Erfahrungen." },
    { part: 3, taskType: "JOINT_PLANNING", title: "Gemeinsam etwas planen", description: "Vorschläge machen, aushandeln und sich einigen." },
];

/** The three Teile of the DTZ Mündliche Prüfung. */
export const DTZ_SPEAKING_PARTS: SpeakingPartMeta[] = [
    { part: 1, taskType: "SELF_INTRODUCTION", title: "Über sich sprechen", description: "Sich vorstellen: Name, Herkunft, Wohnort, Arbeit, Familie, Sprachen." },
    { part: 2, taskType: "PHOTO_EXPERIENCE", title: "Über Erfahrungen sprechen", description: "Ein Foto verstehen, Fragen stellen und von eigenen Erfahrungen erzählen." },
    { part: 3, taskType: "JOINT_PLANNING", title: "Gemeinsam etwas planen", description: "Vorschläge machen, aushandeln und sich einigen." },
];

export const speakingPartsOf = (exam: SpeakingExam = "TELC"): SpeakingPartMeta[] => (exam === "DTZ" ? DTZ_SPEAKING_PARTS : SPEAKING_PARTS);

/** "Mündlicher Ausdruck" (Telc) / "Mündliche Prüfung" (DTZ). */
export const speakingTitleOf = (exam: SpeakingExam = "TELC") => (exam === "DTZ" ? "Mündliche Prüfung" : "Mündlicher Ausdruck");

/** The Übungen page of a Teil (same page for Telc and DTZ). */
export const speakingExercisesHref = (level: string, part: number, exam: SpeakingExam = "TELC") =>
    `/dashboard/exam-prep/teil?section=MUENDLICHER_AUSDRUCK&level=${encodeURIComponent(level)}&part=${part}${exam === "DTZ" ? "&exam=DTZ" : ""}`;

/** The hub of the learning area. */
export const speakingHubHref = (level: string, exam: SpeakingExam = "TELC") =>
    `/dashboard/exam-prep/sprechen?${exam === "DTZ" ? "exam=DTZ&" : ""}level=${encodeURIComponent(level)}`;

export const partOfTaskType = (taskType: string): number => SPEAKING_PARTS.find((p) => p.taskType === taskType)?.part ?? 1;

/**
 * Link to the Lernbereich of a Teil. Without an anchor it opens the learning path; with an anchor it opens the
 * reference view ("Nachschlagen") scrolled to that section - this is what the help panel of an exercise links to.
 */
export const learnHref = (level: string, part: number, anchor?: string, exam: SpeakingExam = "TELC") =>
    `/dashboard/exam-prep/sprechen/lernen?${exam === "DTZ" ? "exam=DTZ&" : ""}level=${encodeURIComponent(level)}&part=${part}${anchor ? `&view=nachschlagen#${anchor}` : ""}`;

export type SpeakingStationId = "ablauf" | "tipps" | "fragen" | "redemittel" | "fehler" | "checkliste";

/** Stations of a Teil's learning path in learning order (ids are validated by the backend). "fragen" exists in Teil 1 only. */
export const SPEAKING_SECTIONS: (LearnSectionMeta & { id: SpeakingStationId })[] = [
    { id: "ablauf", label: "So läuft es ab", emoji: "🎯", hint: "Was erwartet dich in diesem Teil?" },
    { id: "tipps", label: "Tipps", emoji: "💡", hint: "So gelingt das Gespräch." },
    { id: "fragen", label: "Fragen & Nachfragen", emoji: "❓", hint: "Fragen zu allen Themen kennenlernen." },
    { id: "redemittel", label: "Redemittel", emoji: "💬", hint: "Passende Ausdrücke nach Funktion." },
    { id: "fehler", label: "Typische Fehler", emoji: "⚠️", hint: "Diese Fehler solltest du vermeiden." },
    { id: "checkliste", label: "Checkliste", emoji: "✅", hint: "Kontrolliere dein Gespräch nach der Übung." },
];

export const speakingPathTexts = (level: string, part: number, exam: SpeakingExam = "TELC") => ({
    exerciseHref: speakingExercisesHref(level, part, exam),
    exerciseLabel: "Zu den Übungen →",
    allDoneHint: "Du kennst jetzt die Methode. Wende sie in den Sprechübungen an.",
    remainingHint: (n: number) => `Noch ${n} ${n === 1 ? "Station" : "Stationen"} bis zum Sprech-Profi.`,
});
