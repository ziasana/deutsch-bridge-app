"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { WritingPhrase, WritingPhraseCategory } from "@/types/writing";
import { FORMALITY_LABELS, PHRASE_CATEGORY_LABELS } from "../../writingMeta";
import { StepApi } from "../types";
import { haptic } from "../reactions";
import { useQuery } from "@tanstack/react-query";
import { getRedemittel } from "@/services/redemittelService";
import { useRedemittelActions } from "@/componenets/redemittel/useRedemittelActions";

interface FlashDeckProps {
    api: StepApi;
    phrases: WritingPhrase[];
}

/** Redemittel by function: pick a function, then work through its cards one at a time. */
export default function FlashDeck({ api, phrases }: FlashDeckProps) {
    const categories = useMemo(() => {
        const present = new Set(phrases.map((p) => p.category));
        return (Object.keys(PHRASE_CATEGORY_LABELS) as WritingPhraseCategory[]).filter((c) => present.has(c));
    }, [phrases]);

    const [category, setCategory] = useState<WritingPhraseCategory | null>(null);
    const [queue, setQueue] = useState<WritingPhrase[]>([]);
    const [known, setKnown] = useState(0);
    const [finished, setFinished] = useState<Set<WritingPhraseCategory>>(new Set());

    const start = (c: WritingPhraseCategory) => {
        setCategory(c);
        setQueue(phrases.filter((p) => p.category === c).sort((a, b) => a.sortOrder - b.sortOrder));
        setKnown(0);
    };

    const answer = (gotIt: boolean) => {
        haptic(8);
        const [first, ...rest] = queue;
        const nextQueue = gotIt ? rest : [...rest, first];
        if (gotIt) setKnown((k) => k + 1);
        setQueue(nextQueue);
        if (nextQueue.length === 0 && category) {
            setFinished((f) => new Set(f).add(category));
            api.complete();
        }
    };

    if (!category) {
        return (
            <div className="space-y-4">
                <p className="text-lg font-semibold text-foreground">Wähle eine Funktion</p>
                <p className="text-sm text-foreground/65">Was möchtest du ausdrücken? Übe die Redemittel Karte für Karte.</p>
                <div className="grid grid-cols-2 gap-1.5">
                    {categories.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => start(c)}
                            className={cn(
                                "flex min-h-11 items-center justify-between gap-2 rounded-xl border-2 px-3 py-1.5 text-left text-sm font-medium transition cursor-pointer",
                                finished.has(c) || api.solved ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-card hover:border-primary/50 hover:bg-primary/5",
                            )}
                        >
                            <span>{PHRASE_CATEGORY_LABELS[c]}</span>
                            {(finished.has(c) || api.solved) && <Check className="size-4 shrink-0 text-emerald-600" aria-label="Geschafft" />}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-foreground/50">Dieser Schritt ist freiwillig – ein Bereich reicht, um weiterzumachen.</p>
            </div>
        );
    }

    const total = phrases.filter((p) => p.category === category).length;
    const card = queue[0];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <button type="button" onClick={() => setCategory(null)} className="text-sm font-medium text-primary hover:underline cursor-pointer">
                    ← Funktionen
                </button>
                <span className="text-sm font-semibold text-foreground">{PHRASE_CATEGORY_LABELS[category]}</span>
                <span className="text-xs text-foreground/50">{known}/{total}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(known / total) * 100}%` }} />
            </div>

            {card ? (
                <>
                    <div key={card.id + known} className="anim-slide-in rounded-2xl border-2 border-primary/30 bg-card p-5 shadow-card">
                        {card.formality && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-foreground/60">{FORMALITY_LABELS[card.formality]}</span>}
                        <p className="mt-2 text-xl font-bold text-foreground">{card.phrase}</p>
                        {card.example && <p className="mt-3 text-sm italic text-foreground/70">z. B. {card.example}</p>}
                        {card.explanation && <p className="mt-2 text-sm text-foreground/65">{card.explanation}</p>}
                        {card.usageNote && <p className="mt-2 text-xs text-foreground/55">Hinweis: {card.usageNote}</p>}
                        <SaveToMyRedemittel phraseId={card.id} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => answer(false)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-border bg-card text-sm font-medium transition hover:bg-accent cursor-pointer">
                            <RotateCcw className="size-4" /> Nochmal
                        </button>
                        <button type="button" onClick={() => answer(true)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 text-sm font-medium transition hover:bg-emerald-500/20 cursor-pointer">
                            <Check className="size-4" /> Kenne ich
                        </button>
                    </div>
                </>
            ) : (
                <div className="anim-pop space-y-3 rounded-2xl bg-emerald-500/10 p-5 text-center">
                    <p className="text-lg font-bold text-foreground">Geschafft! 🎉</p>
                    <p className="text-sm text-foreground/70">Du kennst alle {total} Redemittel für „{PHRASE_CATEGORY_LABELS[category]}“.</p>
                    <button type="button" onClick={() => setCategory(null)} className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer">
                        Nächste Funktion wählen
                    </button>
                </div>
            )}
        </div>
    );
}

/** "Zu meinen Redemitteln": adds this expression to the learner's own list, where it can be practiced. */
function SaveToMyRedemittel({ phraseId }: Readonly<{ phraseId: string }>) {
    const { toggleSave } = useRedemittelActions();
    const { data: redemittel } = useQuery({
        queryKey: ["redemittel", "detail", phraseId],
        queryFn: () => getRedemittel(phraseId).then((res) => res.data),
    });

    if (!redemittel) return null;

    return (
        <button
            type="button"
            onClick={() => toggleSave.mutate(redemittel)}
            disabled={toggleSave.isPending}
            aria-pressed={redemittel.saved}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 cursor-pointer"
        >
            <Star className={cn("size-4", redemittel.saved ? "fill-amber-400 text-amber-500" : "text-foreground/60")} aria-hidden="true" />
            {redemittel.saved ? "In meinen Redemitteln" : "Zu meinen Redemitteln"}
        </button>
    );
}
