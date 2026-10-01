"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWritingLearnProgress, resetWritingLearnProgress, saveWritingLearnProgress, StationProgress } from "@/services/writingLearnProgressService";
import { LEARN_SECTIONS, LearnSectionId } from "../writingMeta";

export interface StationResult {
    correct: number;
    total: number;
}

type Stored = Partial<Record<LearnSectionId, StationResult>>;

const key = (level: string) => `writing-learn-progress-${level}`;
const isStation = (s: string): s is LearnSectionId => LEARN_SECTIONS.some((x) => x.id === s);

function loadLocal(level: string): Stored {
    try {
        const raw = localStorage.getItem(key(level));
        return raw ? (JSON.parse(raw) as Stored) : {};
    } catch {
        return {};
    }
}

function saveLocal(level: string, value: Stored) {
    try {
        localStorage.setItem(key(level), JSON.stringify(value));
    } catch {
        /* ignore */
    }
}

const ratio = (r: StationResult) => (r.total === 0 ? 1 : r.correct / r.total);

/**
 * Which stations the learner has finished (per level). The server is the source of truth so progress
 * follows the learner across devices; the browser copy keeps it working offline and is how progress made
 * before sync existed is carried over (any local station the server does not know yet is uploaded once).
 */
export function useLearnProgress(level: string) {
    const queryClient = useQueryClient();
    const queryKey = ["writing", "learn-progress", level];
    const [local, setLocal] = useState<Stored>(() => loadLocal(level));
    const migrated = useRef(false);

    const { data: server } = useQuery({
        queryKey,
        queryFn: () => getWritingLearnProgress(level).then((r) => r.data),
        retry: 1,
    });

    // One-time upload of anything that exists only in this browser.
    useEffect(() => {
        if (!server || migrated.current) return;
        migrated.current = true;
        const known = new Set(server.map((s) => s.station));
        const missing = (Object.entries(local) as [LearnSectionId, StationResult][]).filter(([id]) => !known.has(id));
        missing.forEach(([id, r]) => {
            saveWritingLearnProgress(level, id, r.correct, r.total)
                .then((res) => queryClient.setQueryData<StationProgress[]>(queryKey, (old = []) => [...old.filter((o) => o.station !== id), res.data]))
                .catch(() => undefined);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [server]);

    const done: Stored = { ...local };
    for (const s of server ?? []) {
        if (isStation(s.station)) done[s.station] = { correct: s.correct, total: s.total };
    }

    const markDone = useCallback(
        (id: LearnSectionId, result: StationResult) => {
            setLocal((prev) => {
                const best = prev[id] && ratio(prev[id]!) > ratio(result) ? prev[id]! : result;
                const next = { ...prev, [id]: best };
                saveLocal(level, next);
                return next;
            });
            saveWritingLearnProgress(level, id, result.correct, result.total)
                .then((res) => queryClient.setQueryData<StationProgress[]>(["writing", "learn-progress", level], (old = []) => [...old.filter((o) => o.station !== id), res.data]))
                .catch(() => undefined); // offline: the browser copy still has it and is uploaded on the next visit
        },
        [level, queryClient],
    );

    const reset = useCallback(() => {
        setLocal({});
        try {
            localStorage.removeItem(key(level));
        } catch {
            /* ignore */
        }
        queryClient.setQueryData<StationProgress[]>(["writing", "learn-progress", level], []);
        resetWritingLearnProgress(level).catch(() => undefined);
    }, [level, queryClient]);

    return { done, markDone, reset };
}
