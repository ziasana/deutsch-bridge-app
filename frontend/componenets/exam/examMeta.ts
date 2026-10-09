import { BookOpen, Headphones, Info, LucideIcon, Mic, PenLine, Puzzle } from "lucide-react";
import { ExamSection, ExamTaskType } from "@/types/exam";

export interface ExamTypeMeta {
    label: string;
    description: string;
    icon: LucideIcon;
    color: string;
    /** Informational sections (Testformat) have no exercise progress. */
    informational?: boolean;
}

export const EXAM_TYPE_ORDER: ExamSection[] = [
    "LESEVERSTEHEN",
    "SPRACHBAUSTEINE",
    "HOERVERSTEHEN",
    "SCHRIFTLICHER_AUSDRUCK",
    "MUENDLICHER_AUSDRUCK",
    "TESTFORMAT_INFORMATION",
];

export const EXAM_TYPE_META: Record<ExamSection, ExamTypeMeta> = {
    LESEVERSTEHEN: {
        label: "Lesen",
        description: "Trainiere dein Leseverstehen im Prüfungsformat.",
        icon: BookOpen,
        color: "#0d9488",
    },
    SPRACHBAUSTEINE: {
        label: "Sprachbausteine",
        description: "Übe Grammatik und Wortschatz im Prüfungsformat.",
        icon: Puzzle,
        color: "#7c3aed",
    },
    HOERVERSTEHEN: {
        label: "Hörverstehen",
        description: "Trainiere dein Hörverstehen mit echten Prüfungsaufgaben.",
        icon: Headphones,
        color: "#059669",
    },
    SCHRIFTLICHER_AUSDRUCK: {
        label: "Schreiben",
        description: "Übe das Schreiben im Prüfungsformat.",
        icon: PenLine,
        color: "#f97316",
    },
    MUENDLICHER_AUSDRUCK: {
        label: "Mündlicher Ausdruck",
        description: "Übe das Sprechen: Kennenlernen, über ein Thema sprechen und gemeinsam planen.",
        icon: Mic,
        color: "#ec4899",
    },
    TESTFORMAT_INFORMATION: {
        label: "Testformat",
        description: "Prüfungsaufbau, Punkte, Dauer und mehr.",
        icon: Info,
        color: "#0ea5e9",
        informational: true,
    },
};

export const TASK_TYPE_LABELS: Record<ExamTaskType, string> = {
    MATCHING: "Zuordnungsaufgaben",
    SITUATION_MATCHING: "Zuordnung: Situation → Anzeige",
    MULTIPLE_CHOICE: "Multiple-Choice-Aufgaben",
    TRUE_FALSE_NOT_GIVEN: "Aufgaben richtig/falsch/nicht",
    WORD_BANK_CLOZE: "Lückentext (Wortbank)",
    WRITING_TASK: "Schriftlicher Ausdruck",
    TOPIC_INTERVIEW: "Einander kennenlernen",
    OPINION_DISCUSSION: "Über ein Thema sprechen",
    JOINT_PLANNING: "Gemeinsam etwas planen",
};

export const SPRACHBAUSTEINE_TASK_TYPE_LABELS: Partial<Record<ExamTaskType, string>> = {
    MULTIPLE_CHOICE: "Sprachbausteine Teil 1",
    WORD_BANK_CLOZE: "Sprachbausteine Teil 2",
};
