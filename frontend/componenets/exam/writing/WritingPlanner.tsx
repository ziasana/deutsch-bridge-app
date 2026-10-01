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
        <div className="space-y-5 rounded-[10px] bg-card p-5 shadow-card sm:p-6">
            <div>
                <h2 className="text-lg font-semibold text-foreground">📝 Plane deinen Text</h2>
                <p className="mt-1 text-sm text-foreground/60">
                    Notiere zu jedem Punkt ein paar Stichwörter – keine ganzen Sätze. Deine Notizen bleiben beim Schreiben sichtbar.
                </p>
            </div>
            {prompts.map((prompt, i) => (
                <div key={prompt}>
                    <label htmlFor={`plan-${i}`} className="block text-sm font-medium text-foreground">
                        {prompt}
                    </label>
                    <textarea
                        id={`plan-${i}`}
                        value={notes[i] ?? ""}
                        onChange={(e) => setNote(i, e.target.value)}
                        rows={2}
                        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="Stichwörter…"
                    />
                </div>
            ))}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onContinue}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 cursor-pointer"
                >
                    Weiter zum Schreiben <ArrowRight className="size-4" />
                </button>
            </div>
        </div>
    );
}
