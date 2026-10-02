"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { Redemittel } from "@/types/redemittel";
import { categoryEmoji } from "./redemittelMeta";
import { htmlToPlainText } from "@/lib/richTextPlainText";
import { getLevelMeta } from "@/componenets/learning/levelMeta";

/**
 * A card that flips on tap or Enter: the expression on the front, its meaning and an example on the
 * back. Both sides stay in the DOM; the hidden side is hidden from assistive technology.
 */
export default function RedemittelFlipCard({ redemittel: r }: Readonly<{ redemittel: Redemittel }>) {
    const [flipped, setFlipped] = useState(false);
    const color = getLevelMeta(r.level).color;
    const back = r.meaning ?? (r.explanation ? htmlToPlainText(r.explanation) : null) ?? r.categoryLabel;

    return (
        <div className="flip-scene h-44">
            <button
                type="button"
                onClick={() => setFlipped((v) => !v)}
                aria-pressed={flipped}
                aria-label={flipped ? `${r.phrase} – Vorderseite zeigen` : `${r.phrase} – Bedeutung zeigen`}
                className="relative block h-full w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer"
            >
                <div className="flip-inner relative h-full w-full" data-flipped={flipped}>
                    <div
                        aria-hidden={flipped}
                        className="flip-face absolute inset-0 flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-4 shadow-card transition-shadow hover:shadow-lg"
                        style={{ borderTop: `4px solid ${color}` }}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="flex size-9 items-center justify-center rounded-full text-lg" style={{ backgroundColor: `${color}22` }} aria-hidden="true">
                                {categoryEmoji(r.category)}
                            </span>
                            <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: `${color}22`, color }}>
                                {r.level}
                            </span>
                        </div>
                        <p className="break-words text-lg font-bold leading-snug text-foreground">{r.phrase}</p>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground/50">
                            <RotateCw className="size-3.5" aria-hidden="true" />
                            Tippen zum Umdrehen
                        </span>
                    </div>

                    <div
                        aria-hidden={!flipped}
                        className="flip-face flip-back absolute inset-0 flex flex-col justify-between rounded-2xl p-4 text-white shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
                    >
                        <span className="text-xs font-semibold uppercase tracking-wide text-white/80">{r.categoryLabel}</span>
                        <div className="space-y-2">
                            <p className="text-base font-semibold leading-snug">{back}</p>
                            {r.example && <p className="line-clamp-3 text-sm italic text-white/90">„{r.example}“</p>}
                        </div>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-white/80">
                            <RotateCw className="size-3.5" aria-hidden="true" />
                            Zurück
                        </span>
                    </div>
                </div>
            </button>
        </div>
    );
}
