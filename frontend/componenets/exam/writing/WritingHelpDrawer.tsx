"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
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
            <button type="button" aria-label="Hilfe schließen" onClick={onClose} className="fixed inset-0 z-40 bg-black/30 lg:hidden" />
            <aside
                role="dialog"
                aria-label="Schreibhilfe"
                className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-2xl bg-card shadow-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[26rem] lg:rounded-none"
            >
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                    <h2 className="font-semibold text-foreground">Hilfe</h2>
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
                            {HELP_TAB_LABELS[t]}
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
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
