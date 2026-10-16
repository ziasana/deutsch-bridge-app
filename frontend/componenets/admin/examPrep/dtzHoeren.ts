import { ExamPassage, ExamQuestion, ExamTaskType } from "@/types/exam";
import { CHOICE_COUNT, emptyTextTask, findTextTask } from "./dtzTextQuestions";

/** The four parts of the DTZ A2–B1 Hörverstehen paper (20 tasks): what each part is, how many recordings it has and where its numbering starts. */
export interface DtzHoerenPartConfig {
    part: number;
    taskType: ExamTaskType;
    /** Number of recordings (audio files) of the part. */
    recordings: number;
    /** Number of the first task on the answer sheet. */
    firstNumber: number;
    /** Heading of the admin page and learner Teil. */
    title: string;
    description: string;
    /** Label of a recording, e.g. "Ansage 1". */
    recordingLabel: string;
}

export const DTZ_HOEREN_PARTS: Record<number, DtzHoerenPartConfig> = {
    1: {
        part: 1,
        taskType: "MULTIPLE_CHOICE",
        recordings: 4,
        firstNumber: 1,
        title: "Ansagen am Telefon und Durchsagen verstehen",
        description: "Four short announcements (telephone, public address), one multiple-choice task (a, b, c) each — tasks 1–4.",
        recordingLabel: "Ansage",
    },
    2: {
        part: 2,
        taskType: "MULTIPLE_CHOICE",
        recordings: 5,
        firstNumber: 5,
        title: "Kurze Informationen in den Medien verstehen",
        description: "Five short media items (radio, news, weather, traffic ...), one multiple-choice task (a, b, c) each — tasks 5–9.",
        recordingLabel: "Meldung",
    },
    3: {
        part: 3,
        taskType: "TEXT_QUESTIONS",
        recordings: 4,
        firstNumber: 10,
        title: "Alltägliche Gespräche verstehen",
        description: "Four everyday conversations, each with a richtig/falsch task and a multiple-choice task (a, b, c) — tasks 10–17.",
        recordingLabel: "Gespräch",
    },
    4: {
        part: 4,
        taskType: "STATEMENT_MATCHING",
        recordings: 1,
        firstNumber: 18,
        title: "Unterschiedliche Meinungen zu einem Thema verstehen",
        description: "One discussion with three persons; each person is matched to one of several statements (some are distractors) — tasks 18–20.",
        recordingLabel: "Diskussion",
    },
};

export const DTZ_HOEREN_PART_NUMBERS = [1, 2, 3, 4];

/** Number of persons in Teil 4 (one task each). */
export const PERSON_COUNT = 3;
/** Number of statements offered in Teil 4: the persons' ones plus distractors. */
export const DEFAULT_STATEMENT_COUNT = 5;

export interface DtzHoerenSeed {
    taskType: ExamTaskType;
    passages: ExamPassage[];
    questions: ExamQuestion[];
    answerOptions: string[];
    firstTaskNumber: number;
}

/** A blank exercise for a part: the recordings and tasks the format prescribes, ready to be filled in. */
export function seedDtzHoeren(part: number, makePassage: (index: number, label: string) => ExamPassage): DtzHoerenSeed {
    const config = DTZ_HOEREN_PARTS[part] ?? DTZ_HOEREN_PARTS[1];
    const passages = Array.from({ length: config.recordings }, (_, i) => makePassage(i, config.recordings === 1 ? config.recordingLabel : `${config.recordingLabel} ${i + 1}`));
    return { taskType: config.taskType, passages, questions: seedQuestions(config), answerOptions: config.taskType === "STATEMENT_MATCHING" ? Array.from({ length: DEFAULT_STATEMENT_COUNT }, () => "") : [], firstTaskNumber: config.firstNumber };
}

function seedQuestions(config: DtzHoerenPartConfig): ExamQuestion[] {
    if (config.taskType === "MULTIPLE_CHOICE") return Array.from({ length: config.recordings }, (_, i) => emptyTextTask("MULTIPLE_CHOICE", i));
    if (config.taskType === "STATEMENT_MATCHING") {
        return Array.from({ length: PERSON_COUNT }, (_, i) => ({ ...emptyTextTask("MULTIPLE_CHOICE", 0), taskType: "STATEMENT_MATCHING" as ExamTaskType, options: null, prompt: `Person ${i + 1}` }));
    }
    return [];
}

/** Makes sure a saved exercise shows its fixed number of tasks (older or partly filled ones may lack some). */
export function normalizeDtzHoerenQuestions(part: number, taskType: ExamTaskType | null, questions: ExamQuestion[]): ExamQuestion[] {
    const config = DTZ_HOEREN_PARTS[part];
    if (!config || taskType !== config.taskType) return questions;
    if (taskType === "MULTIPLE_CHOICE") {
        return Array.from({ length: config.recordings }, (_, i) => findTextTask(questions, i, "MULTIPLE_CHOICE") ?? emptyTextTask("MULTIPLE_CHOICE", i));
    }
    if (taskType === "STATEMENT_MATCHING") {
        const persons = questions.filter((q) => q.taskType === "STATEMENT_MATCHING");
        return Array.from({ length: PERSON_COUNT }, (_, i) => persons[i] ?? seedQuestions(config)[i]);
    }
    return questions;
}

const hasRecording = (p: ExamPassage) => Boolean(p.audioUrl);

/**
 * Checks the fixed shape of Teil 1, 2 and 4 and returns the first problem (English, like the rest of the admin UI), or null when the exercise
 * can be saved. Teil 3 is checked by {@code validateTextQuestions}.
 */
export function validateDtzHoeren(part: number, passages: ExamPassage[], questions: ExamQuestion[], answerOptions: string[]): string | null {
    const config = DTZ_HOEREN_PARTS[part];
    if (!config) return null;
    const recordings = passages.filter(hasRecording);
    if (recordings.length !== config.recordings) return `Exactly ${config.recordings} recording${config.recordings === 1 ? "" : "s"} (audio files) ${config.recordings === 1 ? "is" : "are"} required (found ${recordings.length}).`;

    if (config.taskType === "MULTIPLE_CHOICE") {
        for (let i = 0; i < passages.length; i++) {
            const name = passages[i].label.trim() || `${config.recordingLabel} ${i + 1}`;
            const task = findTextTask(questions, i, "MULTIPLE_CHOICE");
            if (!task?.prompt.trim()) return `${name}: the question is missing.`;
            const options = (task.options ?? []).map((o) => o.trim());
            if (options.length !== CHOICE_COUNT || options.some((o) => !o)) return `${name}: the task needs exactly ${CHOICE_COUNT} options (a, b, c).`;
            if (!task.correctAnswer.trim() || !options.includes(task.correctAnswer.trim())) return `${name}: choose which option (a, b or c) is correct.`;
        }
        return null;
    }

    if (config.taskType === "STATEMENT_MATCHING") {
        const statements = answerOptions.map((o) => o.trim());
        if (statements.some((o) => !o)) return "Fill in or remove the empty statements.";
        if (statements.length < PERSON_COUNT) return `At least ${PERSON_COUNT} statements are required (one per person, plus distractors).`;
        if (new Set(statements).size !== statements.length) return "Every statement must be different.";
        const used = new Set<string>();
        for (const [i, q] of questions.entries()) {
            if (!q.prompt.trim()) return `Person ${i + 1}: describe the person (e.g. "Person 1: Herr Weber").`;
            if (!q.correctAnswer.trim() || !statements.includes(q.correctAnswer.trim())) return `Person ${i + 1}: choose the matching statement.`;
            if (used.has(q.correctAnswer.trim())) return "A statement can only be the correct answer for one person.";
            used.add(q.correctAnswer.trim());
        }
    }
    return null;
}

/**
 * The questions to save for Teil 1, 2 and 4: cleaned up and numbered from {@code firstNumber}. {@code textIndexRemap} maps an original
 * recording index to its index after empty recordings were dropped.
 */
export function buildDtzHoerenQuestions(part: number, questions: ExamQuestion[], textIndexRemap: Map<number, number>, firstNumber: number): ExamQuestion[] {
    const config = DTZ_HOEREN_PARTS[part];
    if (config?.taskType === "STATEMENT_MATCHING") {
        return questions.map((q, i) => ({ ...q, taskType: "STATEMENT_MATCHING", sectionIndex: 0, options: null, prompt: q.prompt.trim(), correctAnswer: q.correctAnswer.trim(), questionNumber: firstNumber + i }));
    }
    const built: ExamQuestion[] = [];
    for (const [original, kept] of textIndexRemap) {
        const task = findTextTask(questions, original, "MULTIPLE_CHOICE");
        if (!task) continue;
        built.push({
            ...task,
            sectionIndex: kept,
            prompt: task.prompt.trim(),
            correctAnswer: task.correctAnswer.trim(),
            options: (task.options ?? []).map((o) => o.trim()).filter(Boolean),
            questionNumber: firstNumber + kept,
        });
    }
    return built;
}

/** Edits statement {@code index} of Teil 4; a person whose correct answer was that statement follows its new wording. */
export function renameStatement(answerOptions: string[], questions: ExamQuestion[], index: number, value: string): { answerOptions: string[]; questions: ExamQuestion[] } {
    const previous = answerOptions[index];
    return {
        answerOptions: answerOptions.map((o, i) => (i === index ? value : o)),
        questions: questions.map((q) => (previous !== "" && q.correctAnswer === previous ? { ...q, correctAnswer: value } : q)),
    };
}

/** Removes statement {@code index} of Teil 4 and clears the persons that pointed at it. */
export function removeStatement(answerOptions: string[], questions: ExamQuestion[], index: number): { answerOptions: string[]; questions: ExamQuestion[] } {
    const removed = answerOptions[index];
    return {
        answerOptions: answerOptions.filter((_, i) => i !== index),
        questions: questions.map((q) => (removed !== "" && q.correctAnswer === removed ? { ...q, correctAnswer: "" } : q)),
    };
}
