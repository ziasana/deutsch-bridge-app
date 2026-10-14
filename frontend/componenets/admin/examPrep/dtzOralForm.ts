import {
    DtzOralContent, DtzOralDialogueTurn, DtzOralPart, DtzOralTeil1, DtzOralTeil2, DtzOralTeil3, MAX_NOTES, MAX_SOLUTION_TURNS, MIN_NOTES, MIN_SOLUTION_TURNS, PARTICIPANT_A_INSTRUCTIONS, PARTICIPANT_A_TITLE,
    PARTICIPANT_B_INSTRUCTIONS, PARTICIPANT_B_TITLE, PICTURE_PROMPTS, QUESTIONS_PER_LEVEL, TASK_INSTRUCTION, TEIL1_INSTRUCTIONS, TEIL1_TOPICS,
} from "@/types/dtzOral";

/** Teil 1 practice support of one topic. The vocabulary is edited as one word or phrase per line. */
export interface PracticeForm {
    question: string;
    sentenceStarter: string;
    vocabularyText: string;
    en: string;
    fa: string;
}

export interface Teil1Form {
    instructions: string;
    guidance: string;
    en: string;
    fa: string;
    practice: PracticeForm[];
}

export interface Teil2Form {
    topic: string;
    imageUrl: string | null;
    imagePrompt: string;
    altText: string;
    questionsA2: string[];
    questionsB1: string[];
    solutionDescription: string;
    solutionA2: string;
    solutionB1: string;
}

export interface Teil3Form {
    topic: string;
    situation: string;
    notes: string[];
    phrasesText: string;
    /** The possible solution as one turn per line: "A: ..." / "B: ...". */
    solutionText: string;
}

/** Everything the editor edits. Only the form of `part` is used; the others stay empty. */
export interface OralDraft {
    part: DtzOralPart;
    title: string;
    level: string;
    t1: Teil1Form;
    t2: Teil2Form;
    t3: Teil3Form;
}

const emptyPractice = (): PracticeForm => ({ question: "", sentenceStarter: "", vocabularyText: "", en: "", fa: "" });

export const emptyDraft = (part: DtzOralPart): OralDraft => ({
    part,
    title: part === 1 ? "Über sich sprechen" : "",
    level: "A2_B1",
    t1: { instructions: TEIL1_INSTRUCTIONS, guidance: "", en: "", fa: "", practice: TEIL1_TOPICS.map(emptyPractice) },
    t2: { topic: "", imageUrl: null, imagePrompt: "", altText: "", questionsA2: Array(QUESTIONS_PER_LEVEL).fill(""), questionsB1: Array(QUESTIONS_PER_LEVEL).fill(""),
        solutionDescription: "", solutionA2: "", solutionB1: "" },
    t3: { topic: "", situation: "", notes: Array(MIN_NOTES).fill(""), phrasesText: "", solutionText: "" },
});

/** "A: Hallo" / "B - Gern" lines to turns. A line without a speaker continues the previous turn; `invalid` counts lines that cannot be placed. */
export function parseDialogue(text: string): { turns: DtzOralDialogueTurn[]; invalid: number } {
    const turns: DtzOralDialogueTurn[] = [];
    let invalid = 0;
    for (const line of text.split("\n").map((l) => l.trim()).filter(Boolean)) {
        const match = /^([ABab])\s*[:：\-–]\s*(.+)$/.exec(line);
        if (match) turns.push({ speaker: match[1].toUpperCase() as "A" | "B", text: match[2].trim() });
        else if (turns.length > 0) turns[turns.length - 1].text += ` ${line}`;
        else invalid++;
    }
    return { turns, invalid };
}

const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);
const orBlank = (v: string | null | undefined) => v ?? "";
const padded = (list: string[] | undefined, size: number) => Array.from({ length: Math.max(size, list?.length ?? 0) }, (_, i) => list?.[i] ?? "");

/** The editor state of a stored exercise (`metadata.dtzOral`). Missing parts of a hand-made or older exercise stay empty. */
export function draftFromStored(part: DtzOralPart, title: string, metadata: Record<string, unknown> | null | undefined): OralDraft {
    const draft = emptyDraft(part);
    draft.title = title;
    const stored = metadata?.dtzOral as DtzOralContent | undefined;
    if (!stored) return draft;
    draft.level = stored.languageLevel ?? "A2_B1";
    if (stored.part === 1) {
        const t = stored as DtzOralTeil1;
        draft.t1 = {
            instructions: t.instructions || TEIL1_INSTRUCTIONS,
            guidance: orBlank(t.guidance),
            en: orBlank(t.explanation?.en),
            fa: orBlank(t.explanation?.fa),
            practice: TEIL1_TOPICS.map((_, i) => {
                const entry = t.practiceSupport?.find((p) => p.topicNumber === i + 1);
                return entry
                    ? { question: orBlank(entry.question), sentenceStarter: orBlank(entry.sentenceStarter), vocabularyText: (entry.vocabulary ?? []).join("\n"),
                        en: orBlank(entry.explanation?.en), fa: orBlank(entry.explanation?.fa) }
                    : emptyPractice();
            }),
        };
    } else if (stored.part === 2) {
        const t = stored as DtzOralTeil2;
        draft.t2 = {
            topic: orBlank(t.topic),
            imageUrl: t.image?.imageUrl ?? null,
            imagePrompt: orBlank(t.image?.imagePrompt),
            altText: orBlank(t.image?.altText),
            questionsA2: padded(t.participantB?.questionsA2, QUESTIONS_PER_LEVEL),
            questionsB1: padded(t.participantB?.questionsB1, QUESTIONS_PER_LEVEL),
            solutionDescription: orBlank(t.possibleSolution?.description),
            solutionA2: orBlank(t.possibleSolution?.experienceA2),
            solutionB1: orBlank(t.possibleSolution?.experienceB1),
        };
    } else {
        const t = stored as DtzOralTeil3;
        draft.t3 = {
            topic: orBlank(t.topic),
            situation: orBlank(t.situation),
            notes: padded(t.planningNotes?.map((n) => n.label), MIN_NOTES),
            phrasesText: (t.learnerSupport?.examplePhrases ?? []).join("\n"),
            solutionText: (t.possibleSolution?.dialogue ?? []).map((turn) => `${turn.speaker}: ${turn.text}`).join("\n"),
        };
    }
    return draft;
}

/** The exercise in the import shape (without the exam header). This is exactly what the editor endpoints and the validator read. */
export function toBody(draft: OralDraft): Record<string, unknown> {
    const base = { part: draft.part, title: draft.title.trim(), level: draft.level };
    if (draft.part === 1) {
        const t = draft.t1;
        const explanation = (en: string, fa: string) => (en.trim() || fa.trim() ? { ...(en.trim() ? { en: en.trim() } : {}), ...(fa.trim() ? { fa: fa.trim() } : {}) } : undefined);
        return {
            ...base,
            instructions: t.instructions.trim(),
            guidance: t.guidance.trim() || null,
            ...(explanation(t.en, t.fa) ? { explanation: explanation(t.en, t.fa) } : {}),
            topics: TEIL1_TOPICS.map((label, i) => ({ number: i + 1, label })),
            practiceSupport: t.practice
                .map((p, i) => ({ p, i }))
                .filter(({ p }) => p.question.trim() || p.sentenceStarter.trim() || p.vocabularyText.trim() || p.en.trim() || p.fa.trim())
                .map(({ p, i }) => ({
                    topicNumber: i + 1,
                    question: p.question.trim() || null,
                    sentenceStarter: p.sentenceStarter.trim() || null,
                    vocabulary: lines(p.vocabularyText),
                    ...(explanation(p.en, p.fa) ? { explanation: explanation(p.en, p.fa) } : {}),
                })),
        };
    }
    if (draft.part === 2) {
        const t = draft.t2;
        return {
            ...base,
            topic: t.topic.trim(),
            image: { imageUrl: t.imageUrl, imagePrompt: t.imagePrompt.trim() || null, altText: t.altText.trim() || null },
            participantA: { title: PARTICIPANT_A_TITLE, instructions: PARTICIPANT_A_INSTRUCTIONS, questions: [...PICTURE_PROMPTS] },
            participantB: {
                title: PARTICIPANT_B_TITLE,
                instructions: PARTICIPANT_B_INSTRUCTIONS,
                questionsA2: t.questionsA2.map((q) => q.trim()),
                questionsB1: t.questionsB1.map((q) => q.trim()),
            },
            possibleSolution: {
                description: t.solutionDescription.trim() || null,
                experienceA2: t.solutionA2.trim() || null,
                experienceB1: t.solutionB1.trim() || null,
            },
        };
    }
    const t = draft.t3;
    const phrases = lines(t.phrasesText);
    return {
        ...base,
        topic: t.topic.trim(),
        situation: t.situation.trim(),
        taskInstruction: TASK_INSTRUCTION,
        planningNotes: t.notes.map((label, i) => ({ number: i + 1, label: label.trim() })),
        ...(phrases.length ? { learnerSupport: { examplePhrases: phrases } } : {}),
        possibleSolution: { dialogue: parseDialogue(t.solutionText).turns },
    };
}

const TYPES: Record<DtzOralPart, string> = { 1: "SELF_INTRODUCTION", 2: "PHOTO_EXPERIENCE", 3: "JOINT_PLANNING" };

/** The complete import file of the exercise (what "Validate" sends and what the JSON preview shows). */
export function toImportJson(draft: OralDraft): Record<string, unknown> {
    return { exam: "DTZ", section: "MUENDLICH", exerciseType: TYPES[draft.part], ...toBody(draft) };
}

/** Quick checks before the request. The backend repeats all of them (and more); these only save a round trip. */
export function localProblems(draft: OralDraft): string[] {
    const problems: string[] = [];
    if (!draft.title.trim()) problems.push("The title must not be empty.");
    if (draft.part === 2) {
        const t = draft.t2;
        if (!t.topic.trim()) problems.push("The topic must not be empty.");
        if (t.questionsA2.some((q) => !q.trim())) problems.push(`All ${QUESTIONS_PER_LEVEL} A2 questions must be filled in.`);
        if (t.questionsB1.some((q) => !q.trim())) problems.push(`All ${QUESTIONS_PER_LEVEL} B1 questions must be filled in.`);
    }
    if (draft.part === 3) {
        const t = draft.t3;
        if (!t.topic.trim()) problems.push("The topic must not be empty.");
        if (!t.situation.trim()) problems.push("The situation must not be empty.");
        if (t.notes.length < MIN_NOTES || t.notes.length > MAX_NOTES) problems.push(`Between ${MIN_NOTES} and ${MAX_NOTES} planning notes are required.`);
        if (t.notes.some((n) => !n.trim())) problems.push("No planning note may be empty.");
        if (t.solutionText.trim()) {
            const { turns, invalid } = parseDialogue(t.solutionText);
            if (invalid > 0) problems.push("Every line of the possible solution must start with A: or B:.");
            else if (turns.length < MIN_SOLUTION_TURNS || turns.length > MAX_SOLUTION_TURNS) problems.push(`The possible solution needs ${MIN_SOLUTION_TURNS} to ${MAX_SOLUTION_TURNS} turns.`);
        }
        const normalized = t.notes.map((n) => n.trim().toLowerCase()).filter(Boolean);
        if (new Set(normalized).size !== normalized.length) problems.push("Planning notes must not repeat.");
    }
    return problems;
}

/** The learner view of the current editor state (for the live preview). */
export function previewContent(draft: OralDraft): DtzOralContent {
    const body = toBody(draft);
    if (draft.part === 1) {
        const b = body as unknown as Pick<DtzOralTeil1, "instructions" | "guidance" | "explanation" | "topics" | "practiceSupport">;
        return { part: 1, languageLevel: draft.level, ...b, practiceSupport: b.practiceSupport.map((p) => ({ ...p, vocabulary: p.vocabulary ?? [] })) };
    }
    if (draft.part === 2) {
        const b = body as unknown as Pick<DtzOralTeil2, "topic" | "image" | "participantA" | "participantB" | "possibleSolution">;
        return { part: 2, languageLevel: draft.level, ...b };
    }
    const b = body as unknown as Pick<DtzOralTeil3, "topic" | "situation" | "taskInstruction" | "planningNotes" | "learnerSupport" | "possibleSolution">;
    return { part: 3, languageLevel: draft.level, ...b };
}
