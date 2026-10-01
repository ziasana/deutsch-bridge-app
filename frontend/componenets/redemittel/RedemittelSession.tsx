"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, PartyPopper } from "lucide-react";
import LearningProgressBar from "@/componenets/learning/LearningProgressBar";
import { answerRedemittelPractice, answerRedemittelReview } from "@/services/redemittelService";
import { RedemittelExercise as Exercise, RedemittelAnswer } from "@/types/redemittel";
import RedemittelExercise from "./RedemittelExercise";

interface Props {
    mode: "practice" | "review";
    title: string;
    exercises: Exercise[];
    /** Where "Zurück" and the finish buttons lead. */
    backHref: string;
}

/** Runs a practice or review session: one exercise at a time with a progress bar and a closing summary. */
export default function RedemittelSession({ mode, title, exercises, backHref }: Readonly<Props>) {
    const queryClient = useQueryClient();
    const [index, setIndex] = useState(0);
    const [results, setResults] = useState<boolean[]>([]);

    const finished = index >= exercises.length;
    const correct = results.filter(Boolean).length;

    const handleAnswer = async (answer: string): Promise<RedemittelAnswer> => {
        const exercise = exercises[index];
        const send = mode === "review" ? answerRedemittelReview : answerRedemittelPractice;
        const res = (await send(exercise.phraseId, exercise.exerciseId, answer)).data;
        setResults((prev) => [...prev, res.correct]);
        queryClient.invalidateQueries({ queryKey: ["redemittel", "hub"] });
        queryClient.invalidateQueries({ queryKey: ["redemittel", "list"] });
        return res;
    };

    if (finished) {
        return (
            <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-card">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent">
                    <PartyPopper className="size-6 text-primary" aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-foreground">Gut gemacht!</h2>
                <p className="mt-2 text-foreground/70">
                    {correct} von {exercises.length} Antworten waren richtig.
                </p>
                {mode === "review" && (
                    <p className="mt-1 text-sm text-foreground/60">Deine nächsten Wiederholungen sind automatisch geplant.</p>
                )}
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link
                        href={backHref}
                        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        Zur Übersicht
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between gap-3">
                <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Zurück
                </Link>
                <span className="text-sm font-medium text-foreground/60" aria-live="polite">
                    {title}
                </span>
            </div>

            <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-foreground/60">
                    <span>Fortschritt</span>
                    <span>
                        {results.length} / {exercises.length}
                    </span>
                </div>
                <LearningProgressBar
                    value={(results.length / exercises.length) * 100}
                    ariaLabel={`${results.length} von ${exercises.length} erledigt`}
                />
            </div>

            <div className="mt-6">
                <RedemittelExercise
                    key={`${index}-${exercises[index].phraseId}`}
                    exercise={exercises[index]}
                    onAnswer={handleAnswer}
                    onNext={() => setIndex((i) => i + 1)}
                    isLast={index === exercises.length - 1}
                    showSchedule={mode === "review"}
                />
            </div>
        </div>
    );
}
