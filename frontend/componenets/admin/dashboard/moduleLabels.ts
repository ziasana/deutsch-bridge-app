export const MODULE_LABELS: Record<string, string> = {
    VOCABULARY: "Vocabulary",
    GRAMMAR: "Grammar",
    READING: "Reading",
    LISTENING: "Listening",
    EXPRESSIONS: "Expressions",
    NOMEN_VERB_VERBINDUNGEN: "Nomen-Verb-Verbindungen",
    EXAM_PREPARATION: "Exam Preparation",
    DAILY_WORDS: "Daily Words",
    AI_TUTOR: "AI Tutor",
};

export function moduleLabel(module: string): string {
    return MODULE_LABELS[module] ?? module;
}
