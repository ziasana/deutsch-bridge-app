"use client";

import { ArrowRight } from "lucide-react";

interface WritingPlannerProps {
    leitpunkte: string[];
    notes: string[];
    onChange: (notes: string[]) => void;
    onContinue: () => void;
}

/** Optional pre-writing step: one short note per Leitpunkt (or free keywords if the task has none). */
export default function WritingPlanner({ leitpunkte, notes, onChange, onContinue }: WritingPlannerProps) {
    const prompts = leitpunkte.length > 0 ? leitpunkte : ["Stichwörter und Ideen"];
    const setNote = (i: number, value: string) => onChange(notes.map((n, idx) => (idx === i ? value : n)));

    return (
        <div className="space-y-5 rounded-3xl bg-card p-5 shadow-card ring-1 ring-primary/15 sm:p-6">
            <div>
                <h2 className="text-xl font-extrabold text-foreground">📝 Plane deinen Text</h2>
                <p className="mt-1 text-sm text-foreground/60">
                    Notiere zu jedem Punkt ein paar Stichwörter – keine ganzen Sätze. Deine Notizen bleiben beim Schreiben sichtbar.
                </p>
            </div>
            {prompts.map((prompt, i) => (
                <div key={prompt} className="anim-fade-up rounded-2xl bg-gradient-to-br from-(--lesson-from)/10 to-(--lesson-to)/5 p-3 sm:p-4" style={{ animationDelay: `${i * 50}ms` }}>
                    <label htmlFor={`plan-${i}`} className="flex items-start gap-2.5 text-sm font-semibold text-foreground">
                        <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) text-xs font-bold text-white">{i + 1}</span>
                        {prompt}
                    </label>
                    <textarea
                        id={`plan-${i}`}
                        value={notes[i] ?? ""}
                        onChange={(e) => setNote(i, e.target.value)}
                        rows={2}
                        className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="Stichwörter…"
                    />
                </div>
            ))}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onContinue}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                    Weiter zum Schreiben <ArrowRight className="size-4" />
                </button>
            </div>
        </div>
    );
}
