"use client";

import { useState } from "react";
import { WritingExampleData, WritingGuideItem } from "@/types/writing";
import { cn } from "@/lib/utils";

type View = "full" | "analyze";

function ExampleCard({ item }: { item: WritingGuideItem<WritingExampleData> }) {
    const sections = item.data?.sections ?? [];
    const [view, setView] = useState<View>("full");
    const [activeKey, setActiveKey] = useState<string | null>(sections[0]?.key ?? null);
    const active = sections.find((s) => s.key === activeKey) ?? sections[0];

    return (
        <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h4 className="font-semibold text-foreground">{item.title}</h4>
            {item.content && <p className="mt-1 text-sm leading-relaxed text-foreground/65">{item.content}</p>}

            <div role="tablist" aria-label="Ansicht" className="mt-4 inline-flex rounded-full bg-accent p-1 text-xs font-medium">
                {(["full", "analyze"] as const).map((v) => (
                    <button
                        key={v}
                        type="button"
                        role="tab"
                        aria-selected={view === v}
                        onClick={() => setView(v)}
                        className={cn(
                            "rounded-full px-3 py-1.5 transition cursor-pointer",
                            view === v ? "bg-card text-foreground shadow-card" : "text-foreground/60 hover:text-foreground",
                        )}
                    >
                        {v === "full" ? "Vollständiger Text" : "Text analysieren"}
                    </button>
                ))}
            </div>

            {view === "full" ? (
                <div className="mt-4 whitespace-pre-line rounded-lg bg-card p-4 text-sm leading-relaxed text-foreground/85 shadow-card">
                    {sections.map((s) => s.text).join("\n\n")}
                </div>
            ) : (
                <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {sections.map((s) => (
                            <button
                                key={s.key}
                                type="button"
                                aria-pressed={active?.key === s.key}
                                onClick={() => setActiveKey(s.key)}
                                className={cn(
                                    "rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer",
                                    active?.key === s.key
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border text-foreground/70 hover:bg-accent",
                                )}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                    {active && (
                        <div className="rounded-lg bg-card p-4 shadow-card">
                            <p className="whitespace-pre-line rounded-md border-l-4 border-primary bg-primary/5 px-3 py-2 text-sm text-foreground/85">
                                {active.text}
                            </p>
                            {active.why && (
                                <>
                                    <p className="mt-4 text-sm font-semibold text-foreground">Warum ist das wichtig?</p>
                                    <p className="mt-1 text-sm leading-relaxed text-foreground/75">{active.why}</p>
                                </>
                            )}
                            {!!active.phrases?.length && (
                                <>
                                    <p className="mt-4 text-sm font-semibold text-foreground">Passende Redemittel:</p>
                                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground/75">
                                        {active.phrases.map((p) => (
                                            <li key={p}>{p}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function WritingExample({ items }: { items: WritingGuideItem<WritingExampleData>[] }) {
    return (
        <div className="space-y-4">
            {items.map((item) => (
                <ExampleCard key={item.id} item={item} />
            ))}
        </div>
    );
}
