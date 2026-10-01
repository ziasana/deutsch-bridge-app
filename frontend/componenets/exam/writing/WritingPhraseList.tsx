"use client";

import { useMemo, useState } from "react";
import { WritingPhrase, WritingPhraseCategory } from "@/types/writing";
import { cn } from "@/lib/utils";
import RedemittelDetailDialog from "@/componenets/redemittel/RedemittelDetailDialog";
import { FORMALITY_LABELS, PHRASE_CATEGORY_LABELS } from "./writingMeta";

/** Redemittel grouped by function; one category is shown at a time (progressive disclosure). */
export default function WritingPhraseList({ phrases }: { phrases: WritingPhrase[] }) {
    const categories = useMemo(() => {
        const present = new Set(phrases.map((p) => p.category));
        return (Object.keys(PHRASE_CATEGORY_LABELS) as WritingPhraseCategory[]).filter((c) => present.has(c));
    }, [phrases]);
    const [selected, setSelected] = useState<WritingPhraseCategory | null>(null);
    // The same shared Redemittel record the learning module uses - open it to learn or save it.
    const [openId, setOpenId] = useState<string | null>(null);
    const current = selected && categories.includes(selected) ? selected : categories[0];
    const shown = phrases.filter((p) => p.category === current).sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Funktion wählen">
                {categories.map((c) => (
                    <button
                        key={c}
                        type="button"
                        aria-pressed={c === current}
                        onClick={() => setSelected(c)}
                        className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer",
                            c === current ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground/70 hover:bg-accent",
                        )}
                    >
                        {PHRASE_CATEGORY_LABELS[c]}
                    </button>
                ))}
            </div>
            <ul className="mt-4 space-y-2">
                {shown.map((p) => (
                    <li key={p.id} className="rounded-lg bg-accent/40 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setOpenId(p.id)}
                                aria-label={`${p.phrase} – Details, lernen oder speichern`}
                                className="text-left text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
                            >
                                • {p.phrase}
                            </button>
                            {p.formality && (
                                <span className="rounded-full bg-card px-2 py-0.5 text-[11px] text-foreground/55">{FORMALITY_LABELS[p.formality]}</span>
                            )}
                        </div>
                        {p.explanation && <p className="mt-1 text-xs text-foreground/60">{p.explanation}</p>}
                        {p.example && <p className="mt-1 text-xs italic text-foreground/65">z. B. {p.example}</p>}
                        {p.usageNote && <p className="mt-1 text-xs text-foreground/55">Hinweis: {p.usageNote}</p>}
                    </li>
                ))}
            </ul>
            <RedemittelDetailDialog redemittelId={openId} onClose={() => setOpenId(null)} />
        </div>
    );
}
