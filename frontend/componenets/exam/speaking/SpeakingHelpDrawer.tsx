"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { SpeakingContent, SpeakingGuideContent } from "@/types/exam";
import { cn } from "@/lib/utils";
import { SpeakingMistakesPanel, SpeakingPhrasesPanel, SpeakingTipsPanel } from "./SpeakingContentView";
import { learnHref } from "./speakingMeta";

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
            <button type="button" aria-label="Hilfe schließen" onClick={onClose} className="fixed inset-0 z-40 bg-black/30 lg:hidden" />
            <aside
                role="dialog"
                aria-label="Sprechhilfe"
                className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-2xl bg-card shadow-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[26rem] lg:rounded-none"
            >
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                    <h2 className="font-semibold text-foreground">Redemittel &amp; Tipps</h2>
                    <button ref={closeRef} type="button" onClick={onClose} aria-label="Schließen" className="rounded-full p-1.5 hover:bg-accent cursor-pointer">
                        <X className="size-5" />
                    </button>
                </div>
                <div role="tablist" className="flex gap-2 overflow-x-auto px-4 pt-3">
                    {tabs.map((t) => (
                        <button
                            key={t}
                            type="button"
                            role="tab"
                            aria-selected={t === current}
                            onClick={() => setTab(t)}
                            className={cn(
                                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer",
                                t === current ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground/65 hover:bg-accent",
                            )}
                        >
                            {SPEAKING_HELP_LABELS[t]}
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
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
                <div className="border-t border-border/60 px-4 py-2 text-right">
                    <Link href={learnHref(level, part)} className="text-xs font-semibold text-primary hover:underline">
                        Zum Lernbereich →
                    </Link>
                </div>
            </aside>
        </>
    );
}
