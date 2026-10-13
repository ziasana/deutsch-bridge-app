import { WritingChoiceBody } from "@/services/adminExamContentService";

/** DTZ Schreiben: two alternative tasks (Aufgabe A and B), each with exactly four content points. */
export const WRITING_TASK_LABELS = ["A", "B"] as const;
export const WRITING_POINT_COUNT = 4;

export const WRITING_COMMUNICATION_TYPES: [string, string][] = [
    ["FORMAL_EMAIL", "Formal email"],
    ["FORMAL_LETTER", "Formal letter"],
    ["SEMI_FORMAL_EMAIL", "Semi-formal email"],
    ["SEMI_FORMAL_LETTER", "Semi-formal letter"],
    ["INFORMAL_EMAIL", "Informal email"],
    ["INFORMAL_LETTER", "Informal letter"],
];

/** The editable fields of one alternative; the points are always four strings. */
export interface WritingTaskForm {
    taskLabel: "A" | "B";
    title: string;
    topic: string;
    communicationType: string;
    situation: string;
    recipientName: string;
    recipientRole: string;
    writingInstruction: string;
    points: string[];
}

export interface WritingChoiceForm {
    title: string;
    tasks: WritingTaskForm[];
}

export const emptyTask = (taskLabel: "A" | "B"): WritingTaskForm => ({
    taskLabel,
    title: "",
    topic: "",
    communicationType: "FORMAL_EMAIL",
    situation: "",
    recipientName: "",
    recipientRole: "",
    writingInstruction: "",
    points: Array.from({ length: WRITING_POINT_COUNT }, () => ""),
});

export const emptyForm = (): WritingChoiceForm => ({ title: "", tasks: WRITING_TASK_LABELS.map(emptyTask) });

interface StoredTask {
    taskLabel?: string;
    title?: string;
    topic?: string | null;
    communicationType?: string | null;
    situation?: string;
    recipient?: { name?: string | null; role?: string | null } | null;
    writingInstruction?: string;
    points?: { number: number; text: string }[];
}

/** The form for a stored exercise (`metadata.writingChoice`): always two alternatives with four point slots, whatever was saved. */
export function formFromStored(title: string, metadata: Record<string, unknown> | null | undefined): WritingChoiceForm {
    const stored = (metadata?.writingChoice as { tasks?: StoredTask[] } | undefined)?.tasks ?? [];
    return {
        title,
        tasks: WRITING_TASK_LABELS.map((label) => {
            const t = stored.find((s) => s.taskLabel === label);
            const base = emptyTask(label);
            if (!t) return base;
            const points = [...(t.points ?? [])].sort((a, b) => a.number - b.number).map((p) => p.text);
            return {
                ...base,
                title: t.title ?? "",
                topic: t.topic ?? "",
                communicationType: t.communicationType ?? base.communicationType,
                situation: t.situation ?? "",
                recipientName: t.recipient?.name ?? "",
                recipientRole: t.recipient?.role ?? "",
                writingInstruction: t.writingInstruction ?? "",
                points: Array.from({ length: WRITING_POINT_COUNT }, (_, i) => points[i] ?? ""),
            };
        }),
    };
}

/** The first problem (English, like the rest of the admin UI), or null when the form can be saved. The backend checks everything again. */
export function validateWritingForm(form: WritingChoiceForm): string | null {
    if (!form.title.trim()) return "Enter a title.";
    if (form.tasks.length !== 2) return "Exactly two tasks (A and B) are required.";
    for (const t of form.tasks) {
        const name = `Aufgabe ${t.taskLabel}`;
        if (!t.title.trim()) return `${name}: enter a title.`;
        if (!t.situation.trim()) return `${name}: describe the situation.`;
        if (!t.writingInstruction.trim()) return `${name}: enter the writing instruction.`;
        if (t.points.length !== WRITING_POINT_COUNT) return `${name}: exactly ${WRITING_POINT_COUNT} content points are required.`;
        const empty = t.points.findIndex((p) => !p.trim());
        if (empty >= 0) return `${name}: content point ${empty + 1} is empty.`;
    }
    return null;
}

/** The request body in the import shape. A recipient with neither name nor role is sent as null. */
export function toBody(form: WritingChoiceForm): WritingChoiceBody {
    return {
        title: form.title.trim(),
        tasks: form.tasks.map((t) => ({
            taskLabel: t.taskLabel,
            title: t.title.trim(),
            topic: t.topic.trim() || null,
            communicationType: t.communicationType,
            situation: t.situation.trim(),
            recipient: t.recipientName.trim() || t.recipientRole.trim() ? { name: t.recipientName.trim() || null, role: t.recipientRole.trim() || null } : null,
            writingInstruction: t.writingInstruction.trim(),
            points: t.points.map((text, i) => ({ number: i + 1, text: text.trim() })),
        })),
    };
}
