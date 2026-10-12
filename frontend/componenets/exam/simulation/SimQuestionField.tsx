"use client";

import { Flag } from "lucide-react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { cn } from "@/lib/utils";
import type { ExamPassagePublic, ExamQuestionPublic, ExamTaskType } from "@/types/exam";
import type { ExercisePublic } from "@/types/examSimulation";

/** "Keine Anzeige passt" - the backend's answer for a Lesen Teil 3 situation without a matching ad. */
export const NO_AD_ANSWER = "X";

const TFN_OPTIONS = [
    { value: "RICHTIG", label: "Richtig" },
    { value: "FALSCH", label: "Falsch" },
    { value: "NICHT_IM_TEXT", label: "Nicht im Text" },
];

/** Label in front of a shared answer option: the admin-edited label, else a, b, c ... */
export function optionLabel(exercise: ExercisePublic, index: number): string {
    const custom = exercise.answerOptionLabels?.[index];
    return custom && custom.trim() !== "" ? custom : String.fromCodePoint(97 + index);
}

export function questionType(exercise: ExercisePublic, question: ExamQuestionPublic): ExamTaskType | null {
    return question.taskType ?? exercise.taskType;
}

const choice = (selected: boolean) =>
    cn(
        "flex w-full cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition",
        selected ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-foreground/85 hover:bg-accent",
    );

function Radio({ selected }: Readonly<{ selected: boolean }>) {
    return (
        <span aria-hidden className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border", selected ? "border-primary" : "border-foreground/30")}>
            {selected && <span className="size-2 rounded-full bg-primary" />}
        </span>
    );
}

interface Props {
    exercise: ExercisePublic;
    question: ExamQuestionPublic;
    number: number;
    value: string | null;
    flagged: boolean;
    disabled: boolean;
    onChange: (value: string | null) => void;
    onToggleFlag: () => void;
}

/**
 * Answer control of one question. It only shows the question and collects the learner's choice - there is no feedback and
 * no correct answer anywhere on this screen; evaluation happens on the server after submission.
 */
export default function SimQuestionField({ exercise, question, number, value, flagged, disabled, onChange, onToggleFlag }: Readonly<Props>) {
    const type = questionType(exercise, question);
    const select = (next: string) => !disabled && onChange(value === next ? null : next);

    let control: React.ReactNode;
    if (type === "TRUE_FALSE_NOT_GIVEN") {
        control = (
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={`Frage ${number}`}>
                {TFN_OPTIONS.map((o) => (
                    <button key={o.value} type="button" role="radio" aria-checked={value === o.value} disabled={disabled} onClick={() => select(o.value)} className={choice(value === o.value)}>
                        <Radio selected={value === o.value} />
                        {o.label}
                    </button>
                ))}
            </div>
        );
    } else if (type === "MATCHING" || type === "WORD_BANK_CLOZE") {
        const options = exercise.answerOptions ?? [];
        control = (
            <select
                aria-label={`Antwort zu Frage ${number}`}
                value={value ?? ""}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
                <option value="">– bitte wählen –</option>
                {options.map((o, i) => (
                    <option key={`${o}-${i}`} value={o}>
                        {optionLabel(exercise, i)} – {o}
                    </option>
                ))}
            </select>
        );
    } else if (type === "SITUATION_MATCHING") {
        control = (
            <select
                aria-label={`Anzeige zu Situation ${number}`}
                value={value ?? ""}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
                <option value="">– bitte wählen –</option>
                {exercise.passages.map((p: ExamPassagePublic, i) => (
                    <option key={p.id} value={p.id}>
                        {p.label || `Anzeige ${String.fromCodePoint(97 + i)}`}
                    </option>
                ))}
                <option value={NO_AD_ANSWER}>Keine Anzeige passt (X)</option>
            </select>
        );
    } else {
        control = (
            <div className="grid gap-2" role="radiogroup" aria-label={`Frage ${number}`}>
                {(question.options ?? []).map((o, i) => (
                    <button key={`${o}-${i}`} type="button" role="radio" aria-checked={value === o} disabled={disabled} onClick={() => select(o)} className={choice(value === o)}>
                        <Radio selected={value === o} />
                        <span>
                            <span className="me-1.5 font-semibold text-foreground/60">{String.fromCodePoint(97 + i)})</span>
                            {o}
                        </span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <li id={`q-${question.id}`} className="scroll-mt-28 list-none rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums", value ? "bg-primary text-primary-foreground" : "bg-foreground/10 text-foreground/70")}>
                        {number}
                    </span>
                    <div className="min-w-0 text-sm font-medium text-foreground">
                        {question.prompt ? <LessonMarkdown content={question.prompt} className="text-sm text-foreground" /> : question.gapNumber != null ? `Lücke ${question.gapNumber}` : `Frage ${number}`}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onToggleFlag}
                    disabled={disabled}
                    aria-pressed={flagged}
                    title={flagged ? "Markierung entfernen" : "Zur Überprüfung markieren"}
                    className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition", flagged ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-400" : "border-border text-foreground/60 hover:bg-accent")}
                >
                    <Flag className="size-3.5" aria-hidden />
                    {flagged ? "Markiert" : "Markieren"}
                </button>
            </div>
            <div className="mt-3">{control}</div>
        </li>
    );
}
