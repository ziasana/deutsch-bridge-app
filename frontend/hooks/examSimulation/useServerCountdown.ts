"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Display-only countdown. The server sends its own clock (`serverNowMs`) together with the deadline; the remaining time is
 * derived from the server's clock plus the time elapsed since that response arrived (a monotonic timer, so changing the
 * device clock changes nothing). When the countdown reaches zero `onExpire` fires once so the page can ask the server what
 * happens next - the server stays the authority.
 */
export function useServerCountdown(
    deadlineMs: number | null,
    serverNowMs: number,
    onExpire: () => void,
): { remainingSeconds: number } {
    const anchor = useRef({ serverNowMs, perf: typeof performance !== "undefined" ? performance.now() : 0 });
    const expireRef = useRef(onExpire);
    expireRef.current = onExpire;
    const firedFor = useRef<number | null>(null);

    const compute = () => {
        if (deadlineMs == null) return 0;
        const serverNow = anchor.current.serverNowMs + (performance.now() - anchor.current.perf);
        return Math.max(0, Math.ceil((deadlineMs - serverNow) / 1000));
    };
    const [remainingSeconds, setRemainingSeconds] = useState(compute);

    useEffect(() => {
        anchor.current = { serverNowMs, perf: performance.now() };
        setRemainingSeconds(compute());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverNowMs, deadlineMs]);

    useEffect(() => {
        if (deadlineMs == null) return;
        const tick = () => {
            const remaining = compute();
            setRemainingSeconds(remaining);
            if (remaining <= 0 && firedFor.current !== deadlineMs) {
                firedFor.current = deadlineMs;
                expireRef.current();
            }
        };
        tick();
        const id = window.setInterval(tick, 250);
        const onVisible = () => document.visibilityState === "visible" && tick();
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            window.clearInterval(id);
            document.removeEventListener("visibilitychange", onVisible);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deadlineMs]);

    return { remainingSeconds };
}
