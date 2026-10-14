import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getSpeakingLearnProgress,
    resetSpeakingLearnProgress,
    saveSpeakingLearnProgress,
    SpeakingStationProgress,
} from "@/services/speakingLearnProgressService";
import type { SpeakingExamCode } from "@/services/speakingService";
import { StationResult } from "@/componenets/exam/writing/learn/useLearnProgress";

type Stored = Partial<Record<string, StationResult>>;

/** Telc keeps its original key so existing browser copies still work. */
const key = (level: string, part: number, exam: SpeakingExamCode) => `speaking-learn-progress-${exam === "DTZ" ? "dtz-" : ""}${level}-${part}`;
const ratio = (r: StationResult) => (r.total === 0 ? 1 : r.correct / r.total);

function loadLocal(level: string, part: number, exam: SpeakingExamCode): Stored {
    try {
        const raw = localStorage.getItem(key(level, part, exam));
        return raw ? (JSON.parse(raw) as Stored) : {};
    } catch {
        return {};
    }
}

function saveLocal(level: string, part: number, exam: SpeakingExamCode, value: Stored) {
    try {
        localStorage.setItem(key(level, part, exam), JSON.stringify(value));
    } catch {
        /* storage blocked: the server copy still counts */
    }
}

/**
 * Which stations of a Teil's learning path the learner finished. The server is the source of truth (progress follows the learner
 * across devices); the browser copy keeps it working offline and is uploaded once for stations the server does not know yet.
 * All Teile of a level share one request; `all` has every Teil's finished stations for the overview.
 */
export function useSpeakingLearnProgress(level: string, part: number, exam: SpeakingExamCode = "TELC") {
    const queryClient = useQueryClient();
    const queryKey = ["speaking", "learn-progress", exam, level];
    const [local, setLocal] = useState<Stored>(() => loadLocal(level, part, exam));
    const migrated = useRef(false);

    const { data: server } = useQuery({
        queryKey,
        queryFn: () => getSpeakingLearnProgress(level, exam).then((r) => r.data),
        retry: 1,
    });

    const upsert = useCallback(
        (res: SpeakingStationProgress) =>
            queryClient.setQueryData<SpeakingStationProgress[]>(["speaking", "learn-progress", exam, level], (old = []) => [
                ...old.filter((o) => !(o.part === res.part && o.station === res.station)),
                res,
            ]),
        [exam, level, queryClient],
    );

    // One-time upload of anything that exists only in this browser.
    useEffect(() => {
        if (!server || migrated.current) return;
        migrated.current = true;
        const known = new Set(server.filter((s) => s.part === part).map((s) => s.station));
        Object.entries(local)
            .filter(([id]) => !known.has(id))
            .forEach(([id, r]) => {
                saveSpeakingLearnProgress(level, part, id, r!.correct, r!.total, exam).then((res) => upsert(res.data)).catch(() => undefined);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [server]);

    const done: Stored = { ...local };
    for (const s of server ?? []) if (s.part === part) done[s.station] = { correct: s.correct, total: s.total };

    const markDone = useCallback(
        (id: string, result: StationResult) => {
            setLocal((prev) => {
                const best = prev[id] && ratio(prev[id]!) > ratio(result) ? prev[id]! : result;
                const next = { ...prev, [id]: best };
                saveLocal(level, part, exam, next);
                return next;
            });
            saveSpeakingLearnProgress(level, part, id, result.correct, result.total, exam).then((res) => upsert(res.data)).catch(() => undefined);
        },
        [exam, level, part, upsert],
    );

    const reset = useCallback(() => {
        setLocal({});
        try {
            localStorage.removeItem(key(level, part, exam));
        } catch {
            /* ignore */
        }
        queryClient.setQueryData<SpeakingStationProgress[]>(["speaking", "learn-progress", exam, level], (old = []) => old.filter((o) => o.part !== part));
        resetSpeakingLearnProgress(level, part, exam).catch(() => undefined);
    }, [exam, level, part, queryClient]);

    return { done, all: server ?? [], markDone, reset };
}
