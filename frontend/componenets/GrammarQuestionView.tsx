"use client";

import { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuizQuestion } from "@/types/grammar";
import { useI18n } from "@/componenets/I18nProvider";
import { InlineMarkdown } from "@/componenets/LessonMarkdown";

export const quizPrimaryButton =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-50";
export const quizSecondaryButton =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

const normalize = (value: string) => value.trim().toLowerCase();

/** Whether `selected` is the right answer for `question` (shared by the lesson quiz and the category test). */
export function isCorrectAnswer(question: QuizQuestion, selected: string): boolean {
    if (typeof question.answer === "boolean") {
        return normalize(selected) === (question.answer ? "true" : "false");
    }
    return normalize(selected) === normalize(question.answer);
}

interface GrammarQuestionViewProps {
    question: QuizQuestion;
    localized: { title?: string | null; question: string };
    selectedAnswer: string;
    onSelect: (value: string) => void;
    submitted: boolean;
    correct: boolean;
    /** Enter key in the fill-in input. */
    onEnter?: () => void;
}

/** One question with its answer tiles and, once submitted, the green/red feedback - the look of every grammar quiz. */
export default function GrammarQuestionView({ question, localized, selectedAnswer, onSelect, submitted, correct, onEnter }: Readonly<GrammarQuestionViewProps>) {
    const { t } = useI18n();

    // Option tiles: neutral until picked, then green / red once the answer is submitted.
    const optionClass = (isSelected: boolean, isRightOption: boolean) =>
        cn(
            "flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm text-foreground transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default",
            !submitted && !isSelected && "border-border/60 bg-background hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/50 hover:shadow-card",
            !submitted && isSelected && "border-primary bg-primary/10",
            submitted && isRightOption && "border-green-500 bg-green-500/10",
            submitted && isSelected && !isRightOption && "border-red-500 bg-red-500/10",
            submitted && !isSelected && !isRightOption && "border-border/40 opacity-55",
        );
    const optionBadge = (label: ReactNode, isSelected: boolean, isRightOption: boolean) => (
        <span
            aria-hidden="true"
            className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                submitted && isRightOption ? "bg-green-500 text-white" : submitted && isSelected ? "bg-red-500 text-white" : isSelected ? "bg-primary text-primary-foreground" : "bg-accent text-primary",
            )}
        >
            {submitted && isRightOption ? <Check className="size-4" strokeWidth={3} /> : submitted && isSelected ? <X className="size-4" strokeWidth={3} /> : label}
        </span>
    );

    return (
        <>
            {localized.title && (
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    <InlineMarkdown content={localized.title} autoDir />
                </p>
            )}
            <p className="mt-2 text-lg font-semibold leading-relaxed text-foreground sm:text-xl">
                <InlineMarkdown content={localized.question} autoDir />
            </p>

            {question.type === "mcq" && (
                <div className="mt-5 space-y-2.5">
                    {(question.options ?? []).map((option, i) => {
                        const isSelected = selectedAnswer === option;
                        const isRightOption = isCorrectAnswer(question, option);
                        return (
                            <button key={option} type="button" disabled={submitted} onClick={() => onSelect(option)} className={optionClass(isSelected, isRightOption)}>
                                {optionBadge(String.fromCharCode(65 + i), isSelected, isRightOption)}
                                <span className="min-w-0 flex-1 break-words">
                                    <InlineMarkdown content={option} autoDir />
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {question.type === "truefalse" && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                        { value: "True", label: t.grammar.true },
                        { value: "False", label: t.grammar.false },
                    ].map((option) => {
                        const isSelected = selectedAnswer === option.value;
                        const isRightOption = isCorrectAnswer(question, option.value);
                        return (
                            <button key={option.value} type="button" disabled={submitted} onClick={() => onSelect(option.value)} className={cn(optionClass(isSelected, isRightOption), "justify-center py-4 text-base font-semibold")}>
                                {optionBadge(option.value === "True" ? <Check className="size-4" strokeWidth={3} /> : <X className="size-4" strokeWidth={3} />, isSelected, isRightOption)}
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {question.type === "fill" && (
                <input
                    type="text"
                    value={selectedAnswer}
                    disabled={submitted}
                    onChange={(e) => onSelect(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && selectedAnswer && !submitted) onEnter?.();
                    }}
                    placeholder={t.grammar.typeAnswer}
                    className={cn(
                        "mt-5 w-full rounded-2xl border bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-foreground/40 focus:ring-2 focus:ring-primary/40 disabled:opacity-80",
                        submitted ? (correct ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10") : "border-border/60 focus:border-primary",
                    )}
                />
            )}

            {submitted && (
                <div
                    className={cn(
                        "mt-5 flex items-start gap-3 rounded-2xl p-4 text-sm",
                        correct ? "bg-green-500/10 text-green-800 dark:text-green-300" : "bg-red-500/10 text-red-800 dark:text-red-300",
                    )}
                >
                    <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-white", correct ? "bg-green-500" : "bg-red-500")} aria-hidden="true">
                        {correct ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
                    </span>
                    <div>
                        <p className="font-semibold">{correct ? t.grammar.correct : t.grammar.incorrect}</p>
                        {!correct && (
                            <p className="mt-0.5">
                                {t.grammar.correctAnswer}
                                <span className="font-semibold">
                                    {typeof question.answer === "boolean" ? (question.answer ? t.grammar.true : t.grammar.false) : <InlineMarkdown content={question.answer} autoDir />}
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
