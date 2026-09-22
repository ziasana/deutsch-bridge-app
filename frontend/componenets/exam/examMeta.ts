import { BookOpen, Headphones, Info, LucideIcon, PenLine, Puzzle } from "lucide-react";
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
    "TESTFORMAT_INFORMATION",
];

export const EXAM_TYPE_META: Record<ExamSection, ExamTypeMeta> = {
    LESEVERSTEHEN: {
        label: "Lesen",
        description: "Trainiere dein Leseverstehen im Prüfungsformat.",
        icon: BookOpen,
        color: "#3b82f6",
    },
    SPRACHBAUSTEINE: {
        label: "Sprachbausteine",
        description: "Übe Grammatik und Wortschatz im Prüfungsformat.",
        icon: Puzzle,
        color: "#8b5cf6",
    },
    HOERVERSTEHEN: {
        label: "Hörverstehen",
        description: "Trainiere dein Hörverstehen mit echten Prüfungsaufgaben.",
        icon: Headphones,
        color: "#10b981",
    },
    SCHRIFTLICHER_AUSDRUCK: {
        label: "Schreiben",
        description: "Übe das Schreiben im Prüfungsformat.",
        icon: PenLine,
        color: "#f97316",
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
    MATCHING: "Überschriften zuordnen",
    MULTIPLE_CHOICE: "Multiple Choice",
    TRUE_FALSE_NOT_GIVEN: "Richtig / Falsch / Nicht im Text",
    WORD_BANK_CLOZE: "Lückentext",
    WRITING_TASK: "Schriftlicher Ausdruck",
};

export const SPRACHBAUSTEINE_TASK_TYPE_LABELS: Partial<Record<ExamTaskType, string>> = {
    MULTIPLE_CHOICE: "Sprachbausteine Teil 1",
    WORD_BANK_CLOZE: "Sprachbausteine Teil 2",
};
