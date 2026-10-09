"use client";

import { useSyncExternalStore } from "react";
import { Minus, Plus } from "lucide-react";

/** Reading text sizes (static class names so Tailwind keeps them). */
export const TEXT_SIZES = [
    "text-base leading-8",
    "text-[1.15rem] leading-9",
    "text-[1.35rem] leading-[2.6rem]",
    "text-[1.6rem] leading-[3rem]",
] as const;
const DEFAULT_TEXT_SIZE = 1;

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", listener);
    };
};
// Used when storage is blocked (private window): the size still changes for this visit.
const memory = new Map<string, string>();
const readStored = (storageKey: string): string | null => {
    try {
        return window.localStorage.getItem(storageKey) ?? memory.get(storageKey) ?? null;
    } catch {
        return memory.get(storageKey) ?? null;
    }
};

/** The learner's text size (index into TEXT_SIZES), remembered in this browser under `storageKey`. */
export function useTextSize(storageKey: string): [number, (size: number) => void] {
    const raw = useSyncExternalStore(
        subscribe,
        () => readStored(storageKey),
        () => null,
    );
    const stored = Number(raw);
    const size = raw !== null && Number.isInteger(stored) && stored >= 0 && stored < TEXT_SIZES.length ? stored : DEFAULT_TEXT_SIZE;
    const setSize = (next: number) => {
        memory.set(storageKey, String(next));
        try {
            window.localStorage.setItem(storageKey, String(next));
        } catch {
            // Not remembered across visits.
        }
        listeners.forEach((listener) => listener());
    };
    return [size, setSize];
}

/** A− / Aa / A+ control. */
export function TextSizeControl({
    size,
    onChange,
    labels,
}: Readonly<{ size: number; onChange: (size: number) => void; labels: { label: string; smaller: string; larger: string } }>) {
    const btn =
        "flex size-8 cursor-pointer items-center justify-center rounded-full transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent";
    return (
        <div role="group" aria-label={labels.label} className="flex shrink-0 items-center rounded-full bg-accent/70 p-0.5 text-foreground/80">
            <button type="button" className={btn} disabled={size <= 0} aria-label={labels.smaller} onClick={() => onChange(size - 1)}>
                <Minus className="size-4" aria-hidden="true" />
            </button>
            <span aria-hidden="true" className="px-1 text-sm font-extrabold">Aa</span>
            <button type="button" className={btn} disabled={size >= TEXT_SIZES.length - 1} aria-label={labels.larger} onClick={() => onChange(size + 1)}>
                <Plus className="size-4" aria-hidden="true" />
            </button>
        </div>
    );
}
