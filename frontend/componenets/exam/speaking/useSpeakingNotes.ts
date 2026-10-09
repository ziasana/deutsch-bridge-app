import { useCallback, useEffect, useState } from "react";

/** What a learner jots down for one speaking exercise. Kept in this browser only (a per-viewer convenience, not progress). */
export interface SpeakingNotes {
    checked: string[];
    confidence: number | null;
    notes: string;
}

const EMPTY: SpeakingNotes = { checked: [], confidence: null, notes: "" };
const key = (exerciseId: string) => `speaking-notes:${exerciseId}`;

function read(exerciseId: string): SpeakingNotes {
    try {
        const raw = localStorage.getItem(key(exerciseId));
        if (!raw) return EMPTY;
        const parsed = JSON.parse(raw) as Partial<SpeakingNotes>;
        return {
            checked: Array.isArray(parsed.checked) ? parsed.checked.filter((c): c is string => typeof c === "string") : [],
            confidence: typeof parsed.confidence === "number" ? parsed.confidence : null,
            notes: typeof parsed.notes === "string" ? parsed.notes : "",
        };
    } catch {
        return EMPTY; // storage unavailable or corrupt: start empty
    }
}

export function useSpeakingNotes(exerciseId: string) {
    const [state, setState] = useState<SpeakingNotes>(EMPTY);

    useEffect(() => {
        setState(read(exerciseId));
    }, [exerciseId]);

    const update = useCallback(
        (patch: Partial<SpeakingNotes>) => {
            setState((prev) => {
                const next = { ...prev, ...patch };
                try {
                    localStorage.setItem(key(exerciseId), JSON.stringify(next));
                } catch {
                    // storage blocked: the notes simply do not survive a reload
                }
                return next;
            });
        },
        [exerciseId],
    );

    return { ...state, update };
}
