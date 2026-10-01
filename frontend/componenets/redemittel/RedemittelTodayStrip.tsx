"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { getTodaysRedemittel } from "@/services/redemittelService";
import RedemittelFlipCard from "./RedemittelFlipCard";

/** Today's new Redemittel as flip cards: a playful preview that leads into the learn flow. Renders nothing when there are none. */
export default function RedemittelTodayStrip({ onStart }: Readonly<{ onStart: () => void }>) {
    const { data } = useQuery({
        queryKey: ["redemittel", "today-preview"],
        queryFn: () => getTodaysRedemittel().then((res) => res.data),
    });

    if (!data || data.length === 0) return null;

    return (
        <section aria-label="Heute neu" className="border-t border-border/60 px-4 py-5 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-learning-vocabulary/15">
                        <Sparkles className="size-5 text-learning-vocabulary" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Heute neu für dich</h2>
                        <p className="text-sm text-foreground/55">Tippe auf eine Karte, um sie umzudrehen.</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onStart}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded cursor-pointer"
                >
                    Lernen starten
                    <ArrowRight className="size-4" aria-hidden="true" />
                </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {data.map((r) => (
                    <RedemittelFlipCard key={r.id} redemittel={r} />
                ))}
            </div>
        </section>
    );
}
