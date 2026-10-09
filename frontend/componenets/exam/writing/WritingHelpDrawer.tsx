"use client";

import { useEffect, useRef, useState } from "react";
import { LifeBuoy, X } from "lucide-react";
import {
    WritingExampleData,
    WritingHelpTab,
    WritingLearningResponse,
    WritingMistakeData,
    WritingStrategyData,
} from "@/types/writing";
import { cn } from "@/lib/utils";
import WritingStrategy from "./WritingStrategy";
import WritingExample from "./WritingExample";
import WritingPhraseList from "./WritingPhraseList";
import WritingCommonMistakes from "./WritingCommonMistakes";
import { lessonThemeVars } from "../lessonTheme";
import { HELP_TAB_LABELS, itemsOfKind } from "./writingMeta";

interface WritingHelpDrawerProps {
    open: boolean;
    onClose: () => void;
    tabs: WritingHelpTab[];
    data: WritingLearningResponse | undefined;
    loading: boolean;
}

/**
 * Side panel (bottom sheet on phones) with contextual help. The editor stays mounted behind it,
 * so nothing the learner typed is lost while help is open.
 */
export default function WritingHelpDrawer({ open, onClose, tabs, data, loading }: WritingHelpDrawerProps) {
    const [tab, setTab] = useState<WritingHelpTab | null>(null);
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
                aria-label="Schreibhilfe"
                style={lessonThemeVars("writing")}
                className="anim-slide-in fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-t-3xl bg-background shadow-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[28rem] lg:rounded-none lg:rounded-s-3xl"
            >
                <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) px-5 pb-4 pt-5 text-white">
                    <span aria-hidden="true" className="absolute -end-8 -top-10 size-36 rounded-full bg-white/10" />
                    <span aria-hidden="true" className="absolute -bottom-12 start-1/3 size-28 rounded-full bg-white/10" />
                    <div className="relative flex items-center gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                            <LifeBuoy className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-bold leading-tight">Hilfe</h2>
                            <p className="text-xs text-white/85">Tipps, Beispiele und Redemittel zum Schreiben</p>
                        </div>
                        <button ref={closeRef} type="button" onClick={onClose} aria-label="Schließen" className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                            <X className="size-5" aria-hidden="true" />
                        </button>
                    </div>
                    <div role="tablist" className="relative mt-4 flex gap-1 overflow-x-auto rounded-full bg-black/15 p-1">
                        {tabs.map((t) => (
                            <button
                                key={t}
                                type="button"
                                role="tab"
                                aria-selected={t === current}
                                onClick={() => setTab(t)}
                                className={cn(
                                    "min-w-0 flex-1 cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                                    t === current ? "bg-white text-(--lesson-from) shadow-sm" : "text-white/85 hover:bg-white/15",
                                )}
                            >
                                {HELP_TAB_LABELS[t]}
                            </button>
                        ))}
                    </div>
                </div>
                <div key={current} className="anim-fade-up flex-1 overflow-y-auto p-4 sm:p-5">
                    {loading ? (
                        <p className="text-sm text-foreground/55">Wird geladen…</p>
                    ) : !data ? (
                        <p className="text-sm text-foreground/55">Hilfe ist gerade nicht verfügbar.</p>
                    ) : (
                        <>
                            {current === "TIP" && <WritingStrategy items={itemsOfKind<WritingStrategyData>(data, "STRATEGY_STEP")} />}
                            {current === "EXAMPLE" && <WritingExample items={itemsOfKind<WritingExampleData>(data, "EXAMPLE")} />}
                            {current === "PHRASES" && <WritingPhraseList phrases={data.phrases} />}
                            {current === "MISTAKES" && <WritingCommonMistakes items={itemsOfKind<WritingMistakeData>(data, "MISTAKE")} />}
                            {isEmpty(data, current) && <p className="text-sm text-foreground/55">Für dieses Niveau gibt es hier noch keine Inhalte.</p>}
                        </>
                    )}
                </div>
            </aside>
        </>
    );
}

function isEmpty(data: WritingLearningResponse, tab: WritingHelpTab | undefined) {
    switch (tab) {
        case "TIP":
            return itemsOfKind(data, "STRATEGY_STEP").length === 0;
        case "EXAMPLE":
            return itemsOfKind(data, "EXAMPLE").length === 0;
        case "PHRASES":
            return data.phrases.length === 0;
        case "MISTAKES":
            return itemsOfKind(data, "MISTAKE").length === 0;
        default:
            return false;
    }
}
