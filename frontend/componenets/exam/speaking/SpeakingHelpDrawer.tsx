"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, MessagesSquare, X } from "lucide-react";
import { SpeakingContent, SpeakingGuideContent } from "@/types/exam";
import { cn } from "@/lib/utils";
import { SpeakingMistakesPanel, SpeakingPhrasesPanel, SpeakingTipsPanel } from "./SpeakingContentView";
import { learnHref } from "./speakingMeta";
import { lessonThemeVars } from "../lessonTheme";

export type SpeakingHelpTab = "TIPS" | "PHRASES" | "MISTAKES";

export const SPEAKING_HELP_LABELS: Record<SpeakingHelpTab, string> = {
    TIPS: "💡 Tipps",
    PHRASES: "💬 Redemittel",
    MISTAKES: "⚠️ Häufige Fehler",
};

interface SpeakingHelpDrawerProps {
    open: boolean;
    onClose: () => void;
    /** Tabs the current mode offers, in display order. */
    tabs: SpeakingHelpTab[];
    content: SpeakingContent;
    guide?: SpeakingGuideContent | null;
    loading: boolean;
    level: string;
    part: number;
}

/**
 * Help drawer of a speaking exercise - the same pattern as Schreiben: a panel on the right (a bottom sheet on phones) with tabs.
 * The exercise stays mounted behind it, so the learner never leaves the page or loses the state of the attempt.
 */
export default function SpeakingHelpDrawer({ open, onClose, tabs, content, guide, loading, level, part }: Readonly<SpeakingHelpDrawerProps>) {
    const [tab, setTab] = useState<SpeakingHelpTab | null>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const current = tab && tabs.includes(tab) ? tab : tabs[0];

    useEffect(() => {
        if (!open) return;
        closeRef.current?.focus();
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open || tabs.length === 0) return null;

    return (
        <>
            <button type="button" aria-label="Hilfe schließen" onClick={onClose} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
            <aside
                role="dialog"
                aria-label="Sprechhilfe"
                style={lessonThemeVars("speaking")}
                className="anim-slide-in fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-t-3xl bg-background shadow-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[28rem] lg:rounded-none lg:rounded-s-3xl"
            >
                <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) px-5 pb-4 pt-5 text-white">
                    <span aria-hidden="true" className="absolute -end-8 -top-10 size-36 rounded-full bg-white/10" />
                    <span aria-hidden="true" className="absolute -bottom-12 start-1/3 size-28 rounded-full bg-white/10" />
                    <div className="relative flex items-center gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                            <MessagesSquare className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-bold leading-tight">Redemittel &amp; Tipps</h2>
                            <p className="text-xs text-white/85">Teil {part} · {level}</p>
                        </div>
                        <button ref={closeRef} type="button" onClick={onClose} aria-label="Schließen" className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                            <X className="size-5" aria-hidden="true" />
                        </button>
                    </div>
                    <div role="tablist" className="relative mt-4 flex gap-1 rounded-full bg-black/15 p-1">
                        {tabs.map((t) => (
                            <button
                                key={t}
                                type="button"
                                role="tab"
                                aria-selected={t === current}
                                onClick={() => setTab(t)}
                                className={cn(
                                    "min-w-0 flex-1 cursor-pointer whitespace-nowrap rounded-full px-2 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                                    t === current ? "bg-white text-(--lesson-from) shadow-sm" : "text-white/85 hover:bg-white/15",
                                )}
                            >
                                {SPEAKING_HELP_LABELS[t]}
                            </button>
                        ))}
                    </div>
                </div>
                <div key={current} className="anim-fade-up flex-1 overflow-y-auto p-4 sm:p-5">
                    {loading ? (
                        <p className="text-sm text-foreground/55">Wird geladen…</p>
                    ) : (
                        <>
                            {current === "TIPS" && <SpeakingTipsPanel content={content} guide={guide} />}
                            {current === "PHRASES" && <SpeakingPhrasesPanel content={content} guide={guide} />}
                            {current === "MISTAKES" && <SpeakingMistakesPanel guide={guide} />}
                            {!guide && <p className="mt-3 text-sm text-foreground/55">Der Lernbereich ist gerade nicht verfügbar.</p>}
                        </>
                    )}
                </div>
                <div className="shrink-0 border-t border-border/60 bg-card p-3">
                    <Link
                        href={learnHref(level, part)}
                        className="flex items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        Zum Lernbereich <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                </div>
            </aside>
        </>
    );
}
