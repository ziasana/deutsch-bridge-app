// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useServerCountdown } from "./useServerCountdown";

describe("useServerCountdown", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => vi.useRealTimers());

    it("counts down from the server's remaining time, not from the browser clock", () => {
        // The device clock is hours off; only the server's "now" and the deadline matter.
        vi.setSystemTime(new Date("2030-01-01T00:00:00Z"));
        const { result } = renderHook(() => useServerCountdown(1_000_000 + 90 * 60_000, 1_000_000, () => {}));
        expect(result.current.remainingSeconds).toBe(90 * 60);
        act(() => {
            vi.advanceTimersByTime(30_000);
        });
        expect(result.current.remainingSeconds).toBe(90 * 60 - 30);
    });

    it("fires onExpire once when the deadline passes and never goes negative", () => {
        const onExpire = vi.fn();
        const { result } = renderHook(() => useServerCountdown(10_000, 0, onExpire));
        act(() => {
            vi.advanceTimersByTime(9_000);
        });
        expect(onExpire).not.toHaveBeenCalled();
        act(() => {
            vi.advanceTimersByTime(5_000);
        });
        expect(onExpire).toHaveBeenCalledTimes(1);
        expect(result.current.remainingSeconds).toBe(0);
    });

    it("re-anchors on a new server response (e.g. after a refresh)", () => {
        let props = { deadline: 600_000, now: 0 };
        const { result, rerender } = renderHook(() => useServerCountdown(props.deadline, props.now, () => {}));
        act(() => {
            vi.advanceTimersByTime(10_000);
        });
        expect(result.current.remainingSeconds).toBe(590);
        props = { deadline: 600_000, now: 300_000 };
        rerender();
        expect(result.current.remainingSeconds).toBe(300);
    });
});
