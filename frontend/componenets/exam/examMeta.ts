import { BookOpen, Headphones, Info, LucideIcon, Mic, PenLine, Puzzle } from "lucide-react";
import { ExamSection, ExamTaskType, ExamTypeCode } from "@/types/exam";

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
    TRUE_FALSE: "Aufgaben richtig/falsch",
    TEXT_QUESTIONS: "Texte mit Aufgaben (richtig/falsch und a, b, c)",
    TEXT_TRUE_FALSE: "Informationstext mit Aussagen (richtig/falsch)",
    LETTER_GAP_FILL: "Brief oder E-Mail mit Lücken (a, b, c)",
    DIRECTORY_MATCHING: "Kataloge, Register, Verzeichnisse verstehen",
    WORD_BANK_CLOZE: "Lückentext (Wortbank)",
    WRITING_TASK: "Schriftlicher Ausdruck",
    WRITING_TASK_CHOICE: "Schreiben: Aufgabe A oder B",
    TOPIC_INTERVIEW: "Einander kennenlernen",
    OPINION_DISCUSSION: "Über ein Thema sprechen",
    JOINT_PLANNING: "Gemeinsam etwas planen",
};

export const SPRACHBAUSTEINE_TASK_TYPE_LABELS: Partial<Record<ExamTaskType, string>> = {
    MULTIPLE_CHOICE: "Sprachbausteine Teil 1",
    WORD_BANK_CLOZE: "Sprachbausteine Teil 2",
};

export interface ExamTypeInfo {
    code: ExamTypeCode;
    label: string;
    description: string;
    /** The one level the exam is practised at - the level selector is hidden when set (DTZ covers A2 and B1 together). */
    fixedLevel?: string;
    /** Label shown instead of the stored level (DTZ exercises are stored as B1). */
    levelLabel?: string;
    /** Sections that have exercises for this exam, in display order. */
    sections: ExamSection[];
}

export const EXAM_TYPES: ExamTypeInfo[] = [
    {
        code: "TELC",
        label: "Telc B1",
        description: "Prüfung telc Deutsch B1 mit Leseverstehen, Sprachbausteinen, Hören, Schreiben und Sprechen.",
        sections: EXAM_TYPE_ORDER,
    },
    {
        code: "DTZ",
        label: "DTZ A2–B1",
        description: "Deutsch-Test für Zuwanderer (A2–B1) mit Lesen, Hören und Schreiben.",
        fixedLevel: "B1",
        levelLabel: "A2–B1",
        sections: ["LESEVERSTEHEN", "HOERVERSTEHEN", "SCHRIFTLICHER_AUSDRUCK"],
    },
];

export const EXAM_TYPE_BY_CODE: Record<ExamTypeCode, ExamTypeInfo> = Object.fromEntries(EXAM_TYPES.map((t) => [t.code, t])) as Record<ExamTypeCode, ExamTypeInfo>;

/** Level text to show a learner: DTZ's stored B1 is presented as "A2–B1". */
export const displayLevel = (level: string | null | undefined, examType: ExamTypeCode | null | undefined): string =>
    (examType && EXAM_TYPE_BY_CODE[examType]?.levelLabel) || level || "Alle Niveaus";
