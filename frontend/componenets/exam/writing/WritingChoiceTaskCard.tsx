"use client";

import { CheckCircle2, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { WritingChoiceTask } from "@/types/exam";
import { PreviewWritingChoiceTask } from "@/types/examContent";

const TYPE_LABELS: Record<string, string> = {
    FORMAL_EMAIL: "Formelle E-Mail",
    FORMAL_LETTER: "Formeller Brief",
    INFORMAL_EMAIL: "Informelle E-Mail",
    INFORMAL_LETTER: "Informeller Brief",
    SEMI_FORMAL_EMAIL: "Halbformelle E-Mail",
    SEMI_FORMAL_LETTER: "Halbformeller Brief",
};
export const writingTypeLabel = (type: string | null | undefined) => (type ? (TYPE_LABELS[type] ?? type) : null);

/** The admin preview carries the tasks flat (recipientName / recipientRole, plain point strings); the learner response in the import shape. */
export function fromPreviewTask(task: PreviewWritingChoiceTask): WritingChoiceTask {
    return {
        taskLabel: task.label as "A" | "B",
        title: task.title ?? "",
        topic: task.topic,
        communicationType: task.communicationType,
        situation: task.situation ?? "",
        recipient: task.recipientName || task.recipientRole ? { name: task.recipientName, role: task.recipientRole } : null,
        writingInstruction: task.writingInstruction ?? "",
        points: task.points.map((text, i) => ({ number: i + 1, text })),
    };
}

interface WritingChoiceTaskCardProps {
    task: WritingChoiceTask;
    /** Learner view: shows a radio to choose this alternative. Omitted in the read-only admin preview. */
    selected?: boolean;
    onSelect?: () => void;
    /** Radio group name (only with onSelect). */
    groupName?: string;
}

/**
 * One alternative of DTZ Schreiben (Aufgabe A or B): title, situation, recipient, writing instruction and the four numbered points.
 * Used by the learner exercise (with a radio to choose it) and by the admin preview (read only), so both always look the same.
 */
export default function WritingChoiceTaskCard({ task, selected = false, onSelect, groupName = "writing-task" }: Readonly<WritingChoiceTaskCardProps>) {
    const recipient = task.recipient && (task.recipient.name || task.recipient.role)
        ? [task.recipient.name, task.recipient.role].filter(Boolean).join(", ")
        : null;
    const type = writingTypeLabel(task.communicationType);
    const choosable = !!onSelect;
    return (
        <article
            aria-label={`Aufgabe ${task.taskLabel}`}
            className={cn(
                "flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-card ring-1 transition",
                selected ? "ring-2 ring-primary" : "ring-primary/15",
            )}
        >
            <header className="flex items-start gap-3 bg-primary/[0.07] px-5 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-extrabold text-primary-foreground">{task.taskLabel}</span>
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold leading-tight text-foreground">Aufgabe {task.taskLabel}{task.title ? `: ${task.title}` : ""}</h3>
                    {type && <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-foreground/60"><Mail className="size-3.5" aria-hidden="true" />{type}</p>}
                </div>
                {choosable && (
                    <label className="relative flex cursor-pointer items-center gap-2 rounded-full border border-primary/40 bg-card px-3 py-1.5 text-sm font-semibold text-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50">
                        <input
                            type="radio"
                            name={groupName}
                            value={task.taskLabel}
                            checked={selected}
                            onChange={onSelect}
                            className="sr-only"
                            aria-label={`Aufgabe ${task.taskLabel} wählen`}
                        />
                        <span aria-hidden="true">{selected ? "Gewählt" : "Wählen"}</span>
                    </label>
                )}
            </header>
            <div className="flex-1 space-y-4 px-5 py-5">
                <p className="text-sm leading-relaxed text-foreground/85">{task.situation}</p>
                {recipient && (
                    <p className="flex items-center gap-2 text-sm text-foreground/70">
                        <User className="size-4 text-primary" aria-hidden="true" />
                        <span><span className="font-semibold">Empfänger:</span> {recipient}</span>
                    </p>
                )}
                <p className="text-sm font-semibold text-foreground">{task.writingInstruction}</p>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55">Schreiben Sie etwas zu diesen vier Punkten:</p>
                    <ol className="mt-2 space-y-2">
                        {task.points.map((point) => (
                            <li key={point.number} className="flex items-start gap-3 rounded-2xl bg-primary/[0.07] p-3 ring-1 ring-primary/15">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">{point.number}</span>
                                <span className="min-w-0 flex-1 text-sm leading-relaxed text-foreground/85">{point.text}</span>
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary/40" aria-hidden="true" />
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </article>
    );
}
