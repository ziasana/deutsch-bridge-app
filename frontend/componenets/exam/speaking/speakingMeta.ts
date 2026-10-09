import { SpeakingTaskType } from "@/types/exam";
import { LearnSectionMeta } from "../writing/learn/types";

export const SPEAKING_COLOR = "#ec4899";

export interface SpeakingPartMeta {
    part: 1 | 2 | 3;
    taskType: SpeakingTaskType;
    title: string;
    description: string;
}

/** The three Teile of Mündlicher Ausdruck. */
export const SPEAKING_PARTS: SpeakingPartMeta[] = [
    { part: 1, taskType: "TOPIC_INTERVIEW", title: "Einander kennenlernen", description: "Sich vorstellen, Fragen stellen und beantworten." },
    { part: 2, taskType: "OPINION_DISCUSSION", title: "Über ein Thema sprechen", description: "Meinungen wiedergeben, eigene Meinung und Erfahrungen." },
    { part: 3, taskType: "JOINT_PLANNING", title: "Gemeinsam etwas planen", description: "Vorschläge machen, aushandeln und sich einigen." },
];

export const partOfTaskType = (taskType: SpeakingTaskType): number => SPEAKING_PARTS.find((p) => p.taskType === taskType)?.part ?? 1;

/**
 * Link to the Lernbereich of a Teil. Without an anchor it opens the learning path; with an anchor it opens the
 * reference view ("Nachschlagen") scrolled to that section - this is what the help panel of an exercise links to.
 */
export const learnHref = (level: string, part: number, anchor?: string) =>
    `/dashboard/exam-prep/sprechen/lernen?level=${encodeURIComponent(level)}&part=${part}${anchor ? `&view=nachschlagen#${anchor}` : ""}`;

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

export const speakingPathTexts = (level: string, part: number) => ({
    exerciseHref: `/dashboard/exam-prep/teil?section=MUENDLICHER_AUSDRUCK&level=${encodeURIComponent(level)}&part=${part}`,
    exerciseLabel: "Zu den Übungen →",
    allDoneHint: "Du kennst jetzt die Methode. Wende sie in den Sprechübungen an.",
    remainingHint: (n: number) => `Noch ${n} ${n === 1 ? "Station" : "Stationen"} bis zum Sprech-Profi.`,
});
