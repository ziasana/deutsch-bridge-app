"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WritingExampleSection } from "@/types/writing";
import { StepApi } from "../types";
import { haptic } from "../reactions";

interface DiscoverTextProps {
    api: StepApi;
    sections: WritingExampleSection[];
}

/**
 * The model text split into its functional parts. The learner picks a part and sees that part's text,
 * why it works and matching phrases - one part at a time, so it fits a phone screen without scrolling.
 */
export default function DiscoverText({ api, sections }: DiscoverTextProps) {
    const [active, setActive] = useState<string | null>(null);
    const [seen, setSeen] = useState<Set<string>>(new Set());
    const current = sections.find((s) => s.key === active);
    const allSeen = api.solved || seen.size === sections.length;

    const open = (key: string) => {
        setActive(key);
        haptic(8);
        const next = new Set(seen).add(key);
        setSeen(next);
        if (next.size === sections.length) api.complete();
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="text-lg font-semibold text-foreground">Entdecke den Text</p>
                <p className="mt-1 text-sm text-foreground/65">Tippe auf jeden Teil und finde heraus, warum er funktioniert.</p>
            </div>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Textteile">
                {sections.map((s) => {
                    const isSeen = api.solved || seen.has(s.key);
                    return (
                        <button
                            key={s.key}
                            type="button"
                            aria-pressed={active === s.key}
                            onClick={() => open(s.key)}
                            className={cn(
                                "inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 px-3 text-sm font-medium transition cursor-pointer",
                                active === s.key ? "border-primary bg-primary text-primary-foreground" : isSeen ? "border-emerald-500/50 bg-emerald-500/10" : "border-border bg-card hover:border-primary/50",
                            )}
                        >
                            {isSeen && active !== s.key && <Check className="size-3.5 text-emerald-600" />}
                            {s.label}
                        </button>
                    );
                })}
            </div>

            {current ? (
                <div key={current.key} className="anim-pop space-y-3 rounded-2xl border border-primary/30 bg-card p-4 shadow-card">
                    <p className="whitespace-pre-line rounded-lg border-l-4 border-primary bg-primary/5 px-3 py-2 text-sm text-foreground/90">{current.text}</p>
                    {current.why && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">Warum ist das wichtig?</p>
                            <p className="mt-0.5 text-sm leading-relaxed text-foreground/80">{current.why}</p>
                        </div>
                    )}
                    {!!current.phrases?.length && (
                        <ul className="flex flex-wrap gap-1.5">
                            {current.phrases.map((p) => (
                                <li key={p} className="rounded-full bg-accent px-2.5 py-1 text-xs text-foreground/80">{p}</li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : (
                <p className="rounded-2xl border-2 border-dashed border-border px-4 py-8 text-center text-sm text-foreground/45">Wähle oben einen Teil aus.</p>
            )}

            <p className="text-xs text-foreground/50" aria-live="polite">
                {allSeen ? "Alle Teile entdeckt – klasse! 🔍" : `${seen.size} von ${sections.length} entdeckt`}
            </p>
        </div>
    );
}
