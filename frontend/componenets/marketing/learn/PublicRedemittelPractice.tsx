"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { answerPublicRedemittel, getPublicRedemittelExercises } from "@/services/publicLearnService";
import RedemittelExercise from "@/componenets/redemittel/RedemittelExercise";
import type { RedemittelAnswer } from "@/types/redemittel";
import { useMarketing } from "../useMarketing";

/** All the exercises of a free Redemittel, one at a time, graded by the server. Nothing is saved: a visitor has no progress. */
export default function PublicRedemittelPractice({ id }: Readonly<{ id: string }>) {
    const { m } = useMarketing();
    const l = m.learnPage;
    const [index, setIndex] = useState(0);
    const [correct, setCorrect] = useState(0);
    const { data, isPending, isError } = useQuery({
        queryKey: ["public", "learn", "redemittel", id, "exercises"],
        queryFn: () => getPublicRedemittelExercises(id).then((res) => res.data),
        retry: false,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });

    if (isPending) return <p className="px-5 pb-6 text-center text-sm text-foreground/60 sm:px-8">{l.loading}</p>;
    if (isError || !data || data.length === 0) return null;

    const finished = index >= data.length;
    const onAnswer = async (answer: string): Promise<RedemittelAnswer> => {
        const res = (await answerPublicRedemittel(id, data[index].exerciseId, answer)).data;
        if (res.correct || res.attempted) setCorrect((c) => c + 1);
        return res;
    };

    return (
        <section className="border-t border-border/60 bg-foreground/[0.02] px-5 py-6 sm:px-8" aria-label="Übungen">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold uppercase tracking-wide text-primary">Üben</h3>
                <span className="text-xs font-semibold text-foreground/60" aria-live="polite">
                    {Math.min(index + 1, data.length)} / {data.length}
                </span>
            </div>
            {finished ? (
                <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border/60">
                    <p className="text-lg font-bold text-foreground">Gut gemacht!</p>
                    <p className="mt-1 text-sm text-foreground/70">
                        {correct} von {data.length} Antworten waren richtig.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setIndex(0);
                            setCorrect(0);
                        }}
                        className="btn-outline mt-4 rounded-xl px-5 py-2"
                    >
                        Nochmal üben
                    </button>
                </div>
            ) : (
                <RedemittelExercise key={data[index].exerciseId} exercise={data[index]} onAnswer={onAnswer} onNext={() => setIndex(index + 1)} isLast={index === data.length - 1} />
            )}
        </section>
    );
}
