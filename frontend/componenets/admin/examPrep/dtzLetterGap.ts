import { extractGapNumbers } from "@/lib/examGap";
import { ExamPassage, ExamQuestion } from "@/types/exam";

/** DTZ Lesen Teil 5: one letter / email with six gaps, numbered 40-45, each with three options (a, b, c). */
export const LETTER_FIRST_NUMBER = 40;
export const LETTER_GAP_COUNT = 6;
export const LETTER_OPTION_COUNT = 3;

export const emptyGap = (index: number): ExamQuestion => ({
    id: "",
    taskType: "MULTIPLE_CHOICE",
    prompt: `Lücke ${LETTER_FIRST_NUMBER + index}`,
    sectionIndex: 0,
    options: Array.from({ length: LETTER_OPTION_COUNT }, () => ""),
    correctAnswer: "",
    gapNumber: LETTER_FIRST_NUMBER + index,
    questionNumber: LETTER_FIRST_NUMBER + index,
    explanation: "",
    commonMistake: "",
});

/** Always exactly six gap questions with three option slots each, in order, whatever was saved before. */
export const normalizeGaps = (questions: ExamQuestion[]): ExamQuestion[] => {
    const sorted = [...questions].sort((a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0));
    return Array.from({ length: LETTER_GAP_COUNT }, (_, i) => {
        const saved = sorted[i];
        const options = [...(saved?.options ?? [])].slice(0, LETTER_OPTION_COUNT);
        while (options.length < LETTER_OPTION_COUNT) options.push("");
        return {
            ...emptyGap(i),
            ...(saved ?? {}),
            taskType: "MULTIPLE_CHOICE" as const,
            prompt: `Lücke ${LETTER_FIRST_NUMBER + i}`,
            options,
            gapNumber: LETTER_FIRST_NUMBER + i,
            questionNumber: LETTER_FIRST_NUMBER + i,
        };
    });
};

const hasContent = (p: ExamPassage) => p.content.replace(/<[^>]*>/g, "").trim().length > 0;

/** Index of the letter among the passages: the one that carries the gap badges. */
export const letterPassageIndex = (passages: ExamPassage[]): number => passages.findIndex((p) => extractGapNumbers(p.content).length > 0);

/** The first problem (in English, like the rest of the admin UI), or null when the exercise can be saved. */
export function validateLetterGap(passages: ExamPassage[], questions: ExamQuestion[]): string | null {
    const withGaps = passages.filter((p) => extractGapNumbers(p.content).length > 0);
    if (withGaps.length !== 1) return `Exactly 1 letter with the gaps 40–45 is required (found ${withGaps.length} texts with gaps).`;
    if (passages.filter(hasContent).length > 2) return "Only the letter and an optional example are allowed.";
    const numbers = extractGapNumbers(withGaps[0].content);
    for (let n = LETTER_FIRST_NUMBER; n < LETTER_FIRST_NUMBER + LETTER_GAP_COUNT; n++) {
        const count = numbers.filter((x) => x === n).length;
        if (count === 0) return `The letter has no gap ${n}.`;
        if (count > 1) return `Gap ${n} appears ${count} times; every gap may appear once.`;
    }
    if (numbers.some((n) => n < LETTER_FIRST_NUMBER || n >= LETTER_FIRST_NUMBER + LETTER_GAP_COUNT)) return "The letter may only contain the gaps 40–45.";
    if (numbers.some((n, i) => i > 0 && n < numbers[i - 1])) return "The gaps must appear in ascending order (40, 41, ... 45).";
    for (const q of normalizeGaps(questions)) {
        const label = `Gap ${q.questionNumber}`;
        const options = (q.options ?? []).map((o) => o.trim());
        if (options.some((o) => !o)) return `${label}: all three options (a, b, c) must be filled in.`;
        if (new Set(options.map((o) => o.toLowerCase())).size !== LETTER_OPTION_COUNT) return `${label}: two options are identical.`;
        if (!options.includes(q.correctAnswer.trim())) return `${label}: choose the correct option.`;
    }
    return null;
}

/** The questions to save: exactly the six gaps, cleaned up, numbered 40-45 and pointing at the letter passage (after empty passages are dropped). */
export function buildLetterQuestions(questions: ExamQuestion[], passageIndexRemap: Map<number, number>, passages: ExamPassage[]): ExamQuestion[] {
    const letterIndex = passageIndexRemap.get(letterPassageIndex(passages)) ?? 0;
    return normalizeGaps(questions).map((q) => ({
        ...q,
        sectionIndex: letterIndex,
        options: (q.options ?? []).map((o) => o.trim()),
        correctAnswer: q.correctAnswer.trim(),
        explanation: q.explanation.trim(),
    }));
}
