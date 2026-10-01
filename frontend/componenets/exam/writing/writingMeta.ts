import { WritingFormality, WritingHelpTab, WritingMode, WritingGuideItem, WritingGuideKind, WritingLearningResponse, WritingPhraseCategory } from "@/types/writing";

/** Levels the Schreiben architecture is prepared for; content decides what is actually shown. */
export const WRITING_LEVELS = ["A2", "B1", "B2", "C1", "C2"] as const;

export const WRITING_COLOR = "#f97316";

export const PHRASE_CATEGORY_LABELS: Record<WritingPhraseCategory, string> = {
    GREETING: "Anrede",
    INTRODUCTION: "Einleitung",
    OPINION: "Meinung äußern",
    REASON: "Begründen",
    EXAMPLE: "Beispiele geben",
    ADDITION: "Ergänzen",
    CONTRAST: "Vergleichen / Gegensatz",
    AGREEMENT: "Zustimmen",
    DISAGREEMENT: "Widersprechen",
    ADVANTAGE_DISADVANTAGE: "Vor- und Nachteile",
    SUGGESTION: "Vorschläge machen",
    REQUEST: "Bitten",
    APOLOGY: "Entschuldigen",
    QUESTION: "Nach Informationen fragen",
    CONCLUSION: "Beenden / Schluss",
};

export const FORMALITY_LABELS: Record<WritingFormality, string> = {
    INFORMAL: "informell",
    NEUTRAL: "neutral",
    FORMAL: "formell",
};

/** Learning sections in display order; ids double as anchors. */
export const LEARN_SECTIONS = [
    { id: "format", label: "Prüfungsformat", emoji: "🎯", hint: "Was erwartet dich in der Prüfung?" },
    { id: "strategie", label: "Schreibstrategie", emoji: "🧠", hint: "In 6 Schritten zum Text." },
    { id: "aufbau", label: "Textaufbau", emoji: "🧱", hint: "Anrede, Einleitung, Hauptteil, Schluss." },
    { id: "beispiele", label: "Beispiele & Mustertexte", emoji: "📖", hint: "Mustertexte Schritt für Schritt analysieren." },
    { id: "redemittel", label: "Redemittel", emoji: "💬", hint: "Passende Ausdrücke nach Funktion." },
    { id: "satzbausteine", label: "Satzbausteine", emoji: "🧩", hint: "Muster, die du anpassen kannst." },
    { id: "fehler", label: "Typische Fehler", emoji: "⚠️", hint: "Diese Fehler solltest du vermeiden." },
    { id: "checkliste", label: "Checkliste", emoji: "✅", hint: "Kontrolliere deinen Text vor dem Abgeben." },
] as const;

export type LearnSectionId = (typeof LEARN_SECTIONS)[number]["id"];

export function itemsOfKind<D>(data: WritingLearningResponse | undefined, kind: WritingGuideKind): WritingGuideItem<D>[] {
    return (data?.items ?? [])
        .filter((i) => i.kind === kind)
        .sort((a, b) => a.sortOrder - b.sortOrder) as WritingGuideItem<D>[];
}

/** Section id -> whether the level has content for it (empty sections are hidden, not shown blank). */
export function sectionAvailability(data: WritingLearningResponse | undefined): Record<LearnSectionId, boolean> {
    const has = (k: WritingGuideKind) => itemsOfKind(data, k).length > 0;
    return {
        format: has("FORMAT"),
        strategie: has("STRATEGY_STEP"),
        aufbau: has("STRUCTURE_PART"),
        beispiele: has("EXAMPLE"),
        redemittel: (data?.phrases.length ?? 0) > 0,
        satzbausteine: has("SENTENCE_PATTERN"),
        fehler: has("MISTAKE"),
        checkliste: has("CHECKLIST_ITEM"),
    };
}

export const WRITING_MODES: { mode: WritingMode; label: string; hint: string }[] = [
    { mode: "LEARN", label: "Lernen", hint: "Alle Hilfen verfügbar" },
    { mode: "PRACTICE", label: "Üben", hint: "Tipp & Redemittel" },
    { mode: "EXAM", label: "Prüfung", hint: "Keine Hilfe" },
];

/** Which help tabs each mode offers - the single place that decides how much support a mode gives. */
export const HELP_TABS_BY_MODE: Record<WritingMode, WritingHelpTab[]> = {
    LEARN: ["TIP", "EXAMPLE", "PHRASES", "MISTAKES"],
    PRACTICE: ["TIP", "PHRASES"],
    EXAM: [],
};

export const HELP_TAB_LABELS: Record<WritingHelpTab, string> = {
    TIP: "💡 Tipp",
    EXAMPLE: "📖 Beispiel",
    PHRASES: "💬 Redemittel",
    MISTAKES: "⚠️ Häufige Fehler",
};

export const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
