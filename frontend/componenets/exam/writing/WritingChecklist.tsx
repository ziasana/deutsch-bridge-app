"use client";

import { useState } from "react";
import { WritingGuideItem } from "@/types/writing";

const storageKey = (level: string) => `writing-checklist-${level}`;

/** Self-check list; ticks are a per-device convenience, so storage failures are ignored. */
export default function WritingChecklist({ level, items }: { level: string; items: WritingGuideItem[] }) {
    // Only rendered after the learning data has loaded client-side, so reading storage here is safe.
    const [checked, setChecked] = useState<Set<string>>(() => {
        try {
            const raw = localStorage.getItem(storageKey(level));
            return new Set(raw ? (JSON.parse(raw) as string[]) : []);
        } catch {
            return new Set();
        }
    });

    const update = (next: Set<string>) => {
        setChecked(next);
        try {
            localStorage.setItem(storageKey(level), JSON.stringify([...next]));
        } catch {
            /* ignore */
        }
    };

    const toggle = (id: string) => {
        const next = new Set(checked);
        if (!next.delete(id)) next.add(id);
        update(next);
    };

    return (
        <div>
            <ul className="space-y-1">
                {items.map((item) => (
                    <li key={item.id}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm text-foreground/80 hover:bg-accent/50">
                            <input
                                type="checkbox"
                                checked={checked.has(item.id)}
                                onChange={() => toggle(item.id)}
                                className="mt-0.5 size-4 accent-primary"
                            />
                            <span className={checked.has(item.id) ? "text-foreground/50 line-through" : undefined}>{item.title}</span>
                        </label>
                    </li>
                ))}
            </ul>
            <div className="mt-3 flex items-center justify-between text-xs text-foreground/55">
                <span>
                    {checked.size} / {items.length} erledigt
                </span>
                {checked.size > 0 && (
                    <button type="button" onClick={() => update(new Set())} className="font-medium text-primary hover:underline cursor-pointer">
                        Zurücksetzen
                    </button>
                )}
            </div>
        </div>
    );
}
