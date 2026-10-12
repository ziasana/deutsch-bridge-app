import { ExamPassage, ExamQuestion } from "@/types/exam";

/** The two tasks every text of a DTZ Lesen Teil 3 exercise carries, in the order they are shown and numbered. */
export type TextTaskKind = "TRUE_FALSE" | "MULTIPLE_CHOICE";
export const TEXT_TASK_KINDS: readonly TextTaskKind[] = ["TRUE_FALSE", "MULTIPLE_CHOICE"];

/** Number of answer options (a, b, c) of the multiple-choice task. */
export const CHOICE_COUNT = 3;

/** Default number of the first task (the DTZ paper numbers Teil 3 as 31-36). */
export const DEFAULT_FIRST_TASK_NUMBER = 31;

export const emptyTextTask = (kind: TextTaskKind, textIndex: number): ExamQuestion => ({
    id: "",
    taskType: kind,
    prompt: "",
    sectionIndex: textIndex,
    options: kind === "MULTIPLE_CHOICE" ? Array.from({ length: CHOICE_COUNT }, () => "") : null,
    correctAnswer: "",
    gapNumber: null,
    questionNumber: null,
    explanation: "",
    commonMistake: "",
});

export const findTextTask = (questions: ExamQuestion[], textIndex: number, kind: TextTaskKind): ExamQuestion | undefined =>
    questions.find((q) => q.sectionIndex === textIndex && q.taskType === kind);

/** Applies a change to one task of one text, creating the task first when the text does not have it yet. */
export function updateTextTask(questions: ExamQuestion[], textIndex: number, kind: TextTaskKind, patch: Partial<ExamQuestion>): ExamQuestion[] {
    const existing = findTextTask(questions, textIndex, kind);
    if (!existing) return [...questions, { ...emptyTextTask(kind, textIndex), ...patch }];
    return questions.map((q) => (q === existing ? { ...q, ...patch } : q));
}

/**
 * Edits option {@code optionIndex} of a text's multiple-choice task. The correct answer is stored as the option's text, so
 * when the correct option is the one being edited its stored answer has to follow the new wording.
 */
export function updateChoiceOption(questions: ExamQuestion[], textIndex: number, optionIndex: number, value: string): ExamQuestion[] {
    const task = findTextTask(questions, textIndex, "MULTIPLE_CHOICE") ?? emptyTextTask("MULTIPLE_CHOICE", textIndex);
    const options = Array.from({ length: CHOICE_COUNT }, (_, i) => task.options?.[i] ?? "");
    const wasCorrect = task.correctAnswer !== "" && task.correctAnswer === options[optionIndex];
    options[optionIndex] = value;
    return updateTextTask(questions, textIndex, "MULTIPLE_CHOICE", { options, correctAnswer: wasCorrect ? value : task.correctAnswer });
}

/** Drops a text's tasks and re-points the later texts' tasks, for when the text itself is removed. */
export function removeTextTasks(questions: ExamQuestion[], textIndex: number): ExamQuestion[] {
    return questions
        .filter((q) => q.sectionIndex !== textIndex)
        .map((q) => (q.sectionIndex != null && q.sectionIndex > textIndex ? { ...q, sectionIndex: q.sectionIndex - 1 } : q));
}

/** The number a task is shown with: text by text, richtig/falsch first, then multiple choice. */
export const taskNumber = (firstNumber: number, textIndex: number, kind: TextTaskKind): number =>
    firstNumber + textIndex * TEXT_TASK_KINDS.length + TEXT_TASK_KINDS.indexOf(kind);

const hasContent = (p: ExamPassage) => p.content.replace(/<[^>]*>/g, "").trim().length > 0 || /<img[\s>]/i.test(p.content) || Boolean(p.imageUrl);

/**
 * Checks the tasks of every text that has content and returns the first problem (in English, like the rest of the admin
 * UI), or null when the exercise can be saved.
 */
export function validateTextQuestions(passages: ExamPassage[], questions: ExamQuestion[]): string | null {
    const texts = passages.map((p, index) => ({ p, index })).filter(({ p }) => hasContent(p));
    if (texts.length === 0) return "Add at least one text.";
    for (const { p, index } of texts) {
        const name = p.label.trim() || `Text ${index + 1}`;
        const trueFalse = findTextTask(questions, index, "TRUE_FALSE");
        if (!trueFalse?.prompt.trim()) return `${name}: the richtig/falsch statement is missing.`;
        if (trueFalse.correctAnswer !== "RICHTIG" && trueFalse.correctAnswer !== "FALSCH") return `${name}: choose richtig or falsch as the correct answer.`;

        const choice = findTextTask(questions, index, "MULTIPLE_CHOICE");
        if (!choice?.prompt.trim()) return `${name}: the multiple-choice question is missing.`;
        const options = (choice.options ?? []).map((o) => o.trim());
        if (options.filter(Boolean).length < 2) return `${name}: the multiple-choice question needs at least two options.`;
        if (!choice.correctAnswer.trim() || !options.includes(choice.correctAnswer.trim())) return `${name}: choose which option (a, b or c) is correct.`;
    }
    return null;
}

/**
 * The questions to save: only tasks of texts that are kept (texts without content are dropped and the rest renumbered by the
 * caller), cleaned up, ordered text by text and numbered from {@code firstNumber}. {@code textIndexRemap} maps an original
 * text index to its index after empty texts were removed.
 */
export function buildTextQuestions(questions: ExamQuestion[], textIndexRemap: Map<number, number>, firstNumber: number): ExamQuestion[] {
    const built: ExamQuestion[] = [];
    for (const [original, kept] of textIndexRemap) {
        TEXT_TASK_KINDS.forEach((kind) => {
            const task = findTextTask(questions, original, kind);
            if (!task) return;
            built.push({
                ...task,
                sectionIndex: kept,
                prompt: task.prompt.trim(),
                correctAnswer: task.correctAnswer.trim(),
                options: task.options ? task.options.map((o) => o.trim()).filter(Boolean) : null,
                questionNumber: taskNumber(firstNumber, kept, kind),
            });
        });
    }
    return built;
}
