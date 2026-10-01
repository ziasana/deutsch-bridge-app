"use client";

import { ReactNode, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepApi } from "../types";
import Feedback from "../Feedback";
import { CORRECT_MESSAGES, WRONG_MESSAGES, haptic, pickMessage } from "../reactions";

export interface QuizOption {
    id: string;
    label: ReactNode;
}

interface ChoiceQuizProps {
    api: StepApi;
    question: ReactNode;
    /** Optional highlighted text the question is about (a sentence, a phrase). */
    quote?: string;
    options: QuizOption[];
    correctId: string;
    explanation?: string | null;
    salt?: number;
}

/** One question, tap an answer, immediate reaction. The first tap decides whether it counts as correct. */
export default function ChoiceQuiz({ api, question, quote, options, correctId, explanation, salt = 0 }: ChoiceQuizProps) {
    const [picked, setPicked] = useState<string | null>(null);
    const revealed = picked !== null || api.solved;

    const pick = (id: string) => {
        if (revealed) return;
        setPicked(id);
        const correct = id === correctId;
        haptic(correct ? 12 : 30);
        api.complete(correct);
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="text-lg font-semibold text-foreground">{question}</p>
                {quote && <p className="mt-3 rounded-xl bg-accent/60 px-4 py-3 text-base text-foreground/90">„{quote}“</p>}
            </div>
            <div role="group" aria-label="Antworten" className="grid gap-2">
                {options.map((o) => {
                    const isCorrect = o.id === correctId;
                    const isPicked = picked === o.id;
                    return (
                        <button
                            key={o.id}
                            type="button"
                            disabled={revealed}
                            onClick={() => pick(o.id)}
                            className={cn(
                                "flex min-h-12 items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition cursor-pointer disabled:cursor-default",
                                !revealed && "border-border bg-card hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99]",
                                revealed && isCorrect && "border-emerald-500 bg-emerald-500/10 text-foreground",
                                revealed && isPicked && !isCorrect && "anim-shake border-orange-500 bg-orange-500/10 text-foreground",
                                revealed && !isCorrect && !isPicked && "border-border/50 bg-card opacity-60",
                            )}
                        >
                            <span>{o.label}</span>
                            {revealed && isCorrect && <Check className="size-5 shrink-0 text-emerald-600" aria-label="Richtig" />}
                            {revealed && isPicked && !isCorrect && <X className="size-5 shrink-0 text-orange-600" aria-label="Falsch" />}
                        </button>
                    );
                })}
            </div>
            {picked !== null && (
                <Feedback
                    correct={picked === correctId}
                    message={pickMessage(picked === correctId ? CORRECT_MESSAGES : WRONG_MESSAGES, salt)}
                    explanation={explanation}
                />
            )}
        </div>
    );
}
