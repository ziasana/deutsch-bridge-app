import { ExamPassage, ExamQuestion } from "@/types/exam";

/** DTZ Lesen Teil 1: exactly five situations (numbered 21-25) with three options (a, b, c) each. */
export const DIRECTORY_QUESTION_COUNT = 5;
export const DIRECTORY_OPTION_COUNT = 3;
export const DIRECTORY_FIRST_NUMBER = 21;

export const emptyDirectoryQuestion = (index: number): ExamQuestion => ({
    id: "",
    taskType: "MULTIPLE_CHOICE",
    prompt: "",
    sectionIndex: 0,
    options: Array.from({ length: DIRECTORY_OPTION_COUNT }, () => ""),
    correctAnswer: "",
    gapNumber: null,
    questionNumber: DIRECTORY_FIRST_NUMBER + index,
    explanation: "",
    commonMistake: "",
});

/** Always five situations in number order; missing ones are added empty, extra ones dropped, options padded to three. */
export function normalizeDirectoryQuestions(questions: ExamQuestion[]): ExamQuestion[] {
    const sorted = [...questions].sort((a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0));
    return Array.from({ length: DIRECTORY_QUESTION_COUNT }, (_, i) => {
        const existing = sorted[i];
        if (!existing) return emptyDirectoryQuestion(i);
        return {
            ...existing,
            taskType: "MULTIPLE_CHOICE",
            sectionIndex: 0,
            questionNumber: DIRECTORY_FIRST_NUMBER + i,
            options: Array.from({ length: DIRECTORY_OPTION_COUNT }, (_, j) => existing.options?.[j] ?? ""),
        };
    });
}

export function updateDirectoryQuestion(questions: ExamQuestion[], index: number, patch: Partial<ExamQuestion>): ExamQuestion[] {
    return normalizeDirectoryQuestions(questions).map((q, i) => (i === index ? { ...q, ...patch } : q));
}

/** Edits one option; when it is the correct one the stored answer (the option's text) follows the new wording. */
export function updateDirectoryOption(questions: ExamQuestion[], index: number, optionIndex: number, value: string): ExamQuestion[] {
    const question = normalizeDirectoryQuestions(questions)[index];
    const options = [...(question.options ?? [])];
    const wasCorrect = question.correctAnswer !== "" && question.correctAnswer === options[optionIndex];
    options[optionIndex] = value;
    return updateDirectoryQuestion(questions, index, { options, correctAnswer: wasCorrect ? value : question.correctAnswer });
}

const hasContent = (p: ExamPassage) => p.content.replace(/<[^>]*>/g, "").trim().length > 0 || /<img[\s>]/i.test(p.content);

/** The first problem that prevents saving (in English, like the rest of the admin UI), or null. */
export function validateDirectory(passages: ExamPassage[], questions: ExamQuestion[]): string | null {
    if (passages.length === 0 || !hasContent(passages[0])) return "The information source (first text) is required.";
    const all = normalizeDirectoryQuestions(questions);
    for (const [i, q] of all.entries()) {
        const name = `Situation ${DIRECTORY_FIRST_NUMBER + i}`;
        if (!q.prompt.trim()) return `${name}: the situation text is missing.`;
        const options = (q.options ?? []).map((o) => o.trim());
        if (options.some((o) => !o)) return `${name}: all three options (a, b, c) are required.`;
        if (new Set(options).size !== options.length) return `${name}: the three options must be different.`;
        if (!options.includes(q.correctAnswer.trim())) return `${name}: choose which option is correct.`;
    }
    return null;
}

/** The questions to save: trimmed and numbered 21-25, each pointing at the information source (passage 0). */
export function buildDirectoryQuestions(questions: ExamQuestion[]): ExamQuestion[] {
    return normalizeDirectoryQuestions(questions).map((q) => ({
        ...q,
        prompt: q.prompt.trim(),
        correctAnswer: q.correctAnswer.trim(),
        options: (q.options ?? []).map((o) => o.trim()),
    }));
}
