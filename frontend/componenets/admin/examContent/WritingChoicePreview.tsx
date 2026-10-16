"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import WritingChoiceTaskCard, { fromPreviewTask } from "@/componenets/exam/writing/WritingChoiceTaskCard";
import { ExercisePreviewData, PreviewWritingChoice } from "@/types/examContent";

type View = "BOTH" | "A" | "B";
const VIEWS: { value: View; label: string }[] = [
    { value: "BOTH", label: "Exam page (A and B)" },
    { value: "A", label: "Aufgabe A only" },
    { value: "B", label: "Aufgabe B only" },
];

/**
 * DTZ Schreiben as the learner sees it: the writing time, the standard instructions and the two alternatives with their four points each.
 * The switch shows the whole exam page or one alternative alone (as a learner sees it after choosing). There is no model answer.
 */
export default function WritingChoicePreview({ preview, choice }: Readonly<{ preview: ExercisePreviewData; choice: PreviewWritingChoice }>) {
    const [view, setView] = useState<View>("BOTH");
    const tasks = choice.tasks.filter((t) => view === "BOTH" || t.label === view);
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                    <Clock className="size-4" aria-hidden="true" />{choice.durationMinutes} Minuten
                </span>
                {choice.languageLevel && (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">{choice.languageLevel.replace("_", "–")}</span>
                )}
                <div role="radiogroup" aria-label="Preview mode" className="ms-auto inline-flex rounded-lg bg-gray-100 p-1 text-sm dark:bg-gray-700">
                    {VIEWS.map((v) => (
                        <button
                            key={v.value}
                            type="button"
                            role="radio"
                            aria-checked={view === v.value}
                            onClick={() => setView(v.value)}
                            className={`rounded-md px-3 py-1 font-medium ${view === v.value ? "bg-white text-gray-900 shadow dark:bg-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}`}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>
            {preview.instructions && <p className="text-sm italic text-gray-600 dark:text-gray-300">{preview.instructions}</p>}
            <div className={view === "BOTH" ? "grid gap-4 lg:grid-cols-2" : "grid gap-4"}>
                {tasks.map((t) => <WritingChoiceTaskCard key={t.label} task={fromPreviewTask(t)} />)}
            </div>
        </div>
    );
}
