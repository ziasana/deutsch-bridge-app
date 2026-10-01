"use client";

import { useEffect, useRef, useState } from "react";
import { WritingMode } from "@/types/writing";

interface Draft {
    text: string;
    plan: string[];
    mode: WritingMode;
    planDone: boolean;
}

const key = (exerciseId: string) => `writing-draft-${exerciseId}`;

function load(exerciseId: string): Partial<Draft> {
    try {
        const raw = localStorage.getItem(key(exerciseId));
        return raw ? (JSON.parse(raw) as Partial<Draft>) : {};
    } catch {
        return {};
    }
}

/**
 * The learner's in-progress text, planner notes and mode, autosaved to the browser (debounced).
 * Per-device convenience only: storage can be unavailable, so every access is guarded.
 */
export function useWritingDraft(exerciseId: string, leitpunkteCount: number) {
    const [initial] = useState(() => load(exerciseId));
    const [text, setText] = useState(initial.text ?? "");
    const [plan, setPlan] = useState<string[]>(() => {
        const saved = initial.plan ?? [];
        return Array.from({ length: Math.max(leitpunkteCount, saved.length, 1) }, (_, i) => saved[i] ?? "");
    });
    const [mode, setMode] = useState<WritingMode>(initial.mode ?? "PRACTICE");
    const [planDone, setPlanDone] = useState(initial.planDone ?? false);
    const [savedAt, setSavedAt] = useState<Date | null>(null);
    const skipFirst = useRef(true);

    useEffect(() => {
        if (skipFirst.current) {
            skipFirst.current = false;
            return;
        }
        const timer = setTimeout(() => {
            try {
                localStorage.setItem(key(exerciseId), JSON.stringify({ text, plan, mode, planDone } satisfies Draft));
                setSavedAt(new Date());
            } catch {
                /* storage unavailable - the draft just isn't persisted */
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [exerciseId, text, plan, mode, planDone]);

    const clear = () => {
        try {
            localStorage.removeItem(key(exerciseId));
        } catch {
            /* ignore */
        }
        setSavedAt(null);
    };

    return { text, setText, plan, setPlan, mode, setMode, planDone, setPlanDone, savedAt, clear };
}
