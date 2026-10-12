"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveSimulationAnswers } from "@/services/examSimulationService";
import { simulationError } from "@/lib/examSimulation";
import type { AnswerItem, SaveAnswersResponse } from "@/types/examSimulation";

export type AutosaveStatus = "idle" | "saving" | "saved" | "retrying";

interface Options {
    attemptId: string;
    /** The server refused some answers (section locked ...). */
    onRejected: (rejected: SaveAnswersResponse["rejected"]) => void;
    /** The server says the exam is over (time up or no longer running). */
    onFinished: () => void;
}

const DEBOUNCE_MS = 600;
const MAX_RETRY_MS = 15_000;

/**
 * Debounced, retrying answer upload. Edits are kept per question with a monotonically increasing client stamp, so a delayed
 * retry can never overwrite a newer answer on the server. Failed uploads stay queued and are retried with back-off; nothing
 * is dropped while the network is down.
 */
export function useExamAutosave({ attemptId, onRejected, onFinished }: Options) {
    const pending = useRef(new Map<string, AnswerItem>());
    const inFlight = useRef(false);
    const timer = useRef<number | null>(null);
    const retryDelay = useRef(2000);
    const stamp = useRef(0);
    const handlers = useRef({ onRejected, onFinished });
    handlers.current = { onRejected, onFinished };
    const [status, setStatus] = useState<AutosaveStatus>("idle");
    const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

    const flush = useCallback(async (): Promise<boolean> => {
        if (inFlight.current) return false;
        if (pending.current.size === 0) return true;
        inFlight.current = true;
        const batch = Array.from(pending.current.values());
        setStatus("saving");
        try {
            const response = await saveSimulationAnswers(attemptId, batch);
            // Only forget what was sent: an edit made while the request was running has a newer stamp and stays queued.
            for (const item of batch) {
                const key = `${item.partKey}|${item.questionId}`;
                if (pending.current.get(key)?.clientTs === item.clientTs) pending.current.delete(key);
            }
            retryDelay.current = 2000;
            setStatus(pending.current.size === 0 ? "saved" : "saving");
            setLastSavedAt(Date.now());
            if (response.data.rejected.length > 0) handlers.current.onRejected(response.data.rejected);
            if (response.data.timeUp || response.data.status !== "IN_PROGRESS") handlers.current.onFinished();
            return true;
        } catch (error) {
            const body = simulationError(error);
            if (body?.status === 409 || body?.status === 404) {
                // Expired, completed or cancelled: retrying is pointless.
                pending.current.clear();
                handlers.current.onFinished();
                return false;
            }
            setStatus("retrying");
            timer.current = window.setTimeout(() => void flush(), retryDelay.current);
            retryDelay.current = Math.min(MAX_RETRY_MS, retryDelay.current * 2);
            return false;
        } finally {
            inFlight.current = false;
            if (pending.current.size > 0 && timer.current == null) {
                timer.current = window.setTimeout(() => {
                    timer.current = null;
                    void flush();
                }, DEBOUNCE_MS);
            }
        }
    }, [attemptId]);

    const schedule = useCallback(() => {
        if (timer.current != null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            timer.current = null;
            void flush();
        }, DEBOUNCE_MS);
    }, [flush]);

    const enqueue = useCallback(
        (item: Omit<AnswerItem, "clientTs">) => {
            stamp.current = Math.max(stamp.current + 1, Date.now());
            pending.current.set(`${item.partKey}|${item.questionId}`, { ...item, clientTs: stamp.current });
            setStatus("saving");
            schedule();
        },
        [schedule],
    );

    /** Uploads everything now (section change, review, submit). Resolves true when nothing is left unsaved. */
    const flushNow = useCallback(async (): Promise<boolean> => {
        if (timer.current != null) {
            window.clearTimeout(timer.current);
            timer.current = null;
        }
        for (let attempt = 0; attempt < 3; attempt++) {
            if (inFlight.current) {
                await new Promise((resolve) => window.setTimeout(resolve, 150));
                continue;
            }
            if (await flush()) {
                if (pending.current.size === 0) return true;
            }
        }
        return pending.current.size === 0;
    }, [flush]);

    useEffect(() => {
        const onHide = () => {
            if (document.visibilityState === "hidden" && pending.current.size > 0) void flush();
        };
        const onOnline = () => void flush();
        document.addEventListener("visibilitychange", onHide);
        window.addEventListener("online", onOnline);
        return () => {
            document.removeEventListener("visibilitychange", onHide);
            window.removeEventListener("online", onOnline);
            if (timer.current != null) window.clearTimeout(timer.current);
        };
    }, [flush]);

    return { enqueue, flushNow, status, lastSavedAt, pendingCount: () => pending.current.size };
}
