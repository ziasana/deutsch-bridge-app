"use client";

import { Check, Flag, Minus, X } from "lucide-react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { cn } from "@/lib/utils";
import type { ExamPassagePublic, ExamQuestionPublic, ExamTaskType } from "@/types/exam";
import type { ExercisePublic } from "@/types/examSimulation";

/** "Keine Anzeige passt" - the backend's answer for a Lesen Teil 3 situation without a matching ad. */
export const NO_AD_ANSWER = "X";

const TFN_OPTIONS = [
    { value: "RICHTIG", label: "Richtig", icon: Check, on: "border-emerald-500 bg-emerald-500 text-white" },
    { value: "FALSCH", label: "Falsch", icon: X, on: "border-rose-500 bg-rose-500 text-white" },
    { value: "NICHT_IM_TEXT", label: "Nicht im Text", icon: Minus, on: "border-slate-500 bg-slate-500 text-white" },
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
        "flex w-full cursor-pointer items-start gap-3 rounded-2xl border-2 px-3.5 py-3 text-left text-sm transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-60",
        selected ? "anim-pop border-primary bg-primary/10 text-foreground shadow-sm" : "border-border bg-card text-foreground/85 hover:border-primary/50 hover:bg-accent",
    );

/** Lettered badge in front of a choice (a, b, c ...), filled in the section colour when chosen. */
function Letter({ selected, children }: Readonly<{ selected: boolean; children: React.ReactNode }>) {
    return (
        <span aria-hidden className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold uppercase transition", selected ? "bg-primary text-primary-foreground" : "bg-foreground/10 text-foreground/60")}>
            {selected ? <Check className="size-3.5" strokeWidth={3} /> : children}
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
                {TFN_OPTIONS.map(({ value: v, label, icon: Icon, on }) => (
                    <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={value === v}
                        disabled={disabled}
                        onClick={() => select(v)}
                        className={cn(
                            "flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-60",
                            value === v ? cn("anim-pop shadow-md", on) : "border-border bg-background text-foreground/75 hover:border-primary/50",
                        )}
                    >
                        <Icon className="size-4" strokeWidth={3} aria-hidden />
                        {label}
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
                className={cn("w-full cursor-pointer rounded-2xl border-2 bg-card px-3.5 py-3 text-sm font-medium text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50", value ? "border-primary bg-primary/5" : "border-dashed border-primary/40")}
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
                className={cn("w-full cursor-pointer rounded-2xl border-2 bg-card px-3.5 py-3 text-sm font-medium text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50", value ? "border-primary bg-primary/5" : "border-dashed border-primary/40")}
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
                        <Letter selected={value === o}>{String.fromCodePoint(97 + i)}</Letter>
                        <span className="pt-0.5">{o}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <li id={`q-${question.id}`} className={cn("scroll-mt-28 list-none rounded-3xl bg-card p-4 shadow-card ring-2 transition sm:p-5", flagged ? "ring-amber-500/60" : value ? "ring-primary/30" : "ring-transparent")}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold tabular-nums transition", value ? "bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) text-white shadow-sm" : "bg-foreground/10 text-foreground/70")}>
                        {number}
                    </span>
                    <div className="min-w-0 pt-1 text-sm font-medium leading-snug text-foreground">
                        {question.prompt ? <LessonMarkdown content={question.prompt} className="text-sm text-foreground" /> : question.gapNumber != null ? `Lücke ${question.gapNumber}` : `Frage ${number}`}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onToggleFlag}
                    disabled={disabled}
                    aria-pressed={flagged}
                    title={flagged ? "Markierung entfernen" : "Zur Überprüfung markieren"}
                    className={cn("inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition disabled:cursor-default", flagged ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-400" : "border-border text-foreground/60 hover:bg-accent")}
                >
                    <Flag className={cn("size-3.5", flagged && "fill-current")} aria-hidden />
                    {flagged ? "Markiert" : "Markieren"}
                </button>
            </div>
            <div className="mt-4">{control}</div>
        </li>
    );
}
