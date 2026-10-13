import { ExamPassage, ExamQuestion } from "@/types/exam";

/** DTZ Lesen Teil 4: one information text and three richtig/falsch statements, numbered 37-39. */
export const TRUE_FALSE_FIRST_NUMBER = 37;
export const TRUE_FALSE_COUNT = 3;

export const emptyStatement = (index: number): ExamQuestion => ({
    id: "",
    taskType: "TRUE_FALSE",
    prompt: "",
    sectionIndex: 0,
    options: null,
    correctAnswer: "",
    gapNumber: null,
    questionNumber: TRUE_FALSE_FIRST_NUMBER + index,
    explanation: "",
    commonMistake: "",
});

/** Always exactly three statements, in order, whatever was saved before (a new or hand-made exercise starts with empty ones). */
export const normalizeStatements = (questions: ExamQuestion[]): ExamQuestion[] => {
    const sorted = [...questions].sort((a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0));
    return Array.from({ length: TRUE_FALSE_COUNT }, (_, i) => ({
        ...emptyStatement(i),
        ...(sorted[i] ?? {}),
        taskType: "TRUE_FALSE" as const,
        sectionIndex: 0,
        options: null,
        questionNumber: TRUE_FALSE_FIRST_NUMBER + i,
    }));
};

const hasContent = (p: ExamPassage) => p.content.replace(/<[^>]*>/g, "").trim().length > 0 || /<img[\s>]/i.test(p.content);

/** The first problem (in English, like the rest of the admin UI), or null when the exercise can be saved. */
export function validateTrueFalseText(passages: ExamPassage[], questions: ExamQuestion[]): string | null {
    const texts = passages.filter(hasContent);
    if (texts.length !== 1) return `Exactly 1 text is required (found ${texts.length}).`;
    if (!texts[0].label.trim()) return "The text needs a title.";
    const statements = normalizeStatements(questions);
    for (const [i, q] of statements.entries()) {
        const number = TRUE_FALSE_FIRST_NUMBER + i;
        if (!q.prompt.trim()) return `Statement ${number} is missing.`;
        if (q.correctAnswer !== "RICHTIG" && q.correctAnswer !== "FALSCH") return `Statement ${number}: choose richtig or falsch as the correct answer.`;
    }
    return null;
}

/** The questions to save: exactly the three statements, cleaned up and numbered 37-39. */
export function buildTrueFalseQuestions(questions: ExamQuestion[]): ExamQuestion[] {
    return normalizeStatements(questions).map((q) => ({ ...q, prompt: q.prompt.trim(), correctAnswer: q.correctAnswer.trim() }));
}
