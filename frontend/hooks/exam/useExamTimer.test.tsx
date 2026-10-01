// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useExamTimerStore from "@/store/useExamTimerStore";
import { useExamTimer } from "./useExamTimer";
import { elapsedSecondsAt } from "@/lib/examTime";
import { ExamPracticeSession } from "@/types/examTime";

const session = (over: Partial<ExamPracticeSession> = {}): ExamPracticeSession => ({
    id: "s1",
    scope: "TEIL",
    mode: "TIME_TRAINING",
    section: "LESEVERSTEHEN",
    level: "B1",
    teil: 2,
    exerciseId: null,
    startedAt: "2026-01-01T10:00:00Z",
    targetSeconds: 20 * 60,
    ...over,
});

const T0 = new Date("2026-01-01T10:00:00Z").getTime();

function mount() {
    return renderHook(() => useExamTimer(useExamTimerStore((s) => s.active)));
}

describe("useExamTimer", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(T0);
        useExamTimerStore.setState({ active: null });
    });
    afterEach(() => vi.useRealTimers());

    it("starts at zero and counts elapsed time", () => {
        useExamTimerStore.getState().start(session(), T0);
        const { result } = mount();
        expect(result.current.elapsedSeconds).toBe(0);

        act(() => vi.advanceTimersByTime(65_000));
        expect(result.current.elapsedSeconds).toBe(65);
    });

    it("survives re-renders without restarting", () => {
        useExamTimerStore.getState().start(session(), T0);
        const { result, rerender } = mount();
        act(() => vi.advanceTimersByTime(30_000));
        rerender();
        rerender();
        expect(result.current.elapsedSeconds).toBe(30);
    });

    it("does not drift when ticks are throttled: it catches up from the clock", () => {
        useExamTimerStore.getState().start(session(), T0);
        const { result } = mount();
        // A hidden tab fires no timers; the wall clock still advances ten minutes.
        act(() => {
            vi.setSystemTime(T0 + 10 * 60_000);
            document.dispatchEvent(new Event("visibilitychange"));
        });
        expect(result.current.elapsedSeconds).toBe(600);
    });

    it("reaches the target and reports the status", () => {
        useExamTimerStore.getState().start(session({ targetSeconds: 60 }), T0);
        const { result } = mount();
        act(() => vi.advanceTimersByTime(59_000));
        expect(result.current.status?.status).toBe("ON_TRACK");
        act(() => vi.advanceTimersByTime(1_000));
        expect(result.current.status?.status).toBe("TARGET_REACHED");
        act(() => vi.advanceTimersByTime(16_000));
        expect(result.current.status?.status).toBe("OVER_TIME");
    });

    it("pauses and resumes without counting the paused time", () => {
        useExamTimerStore.getState().start(session(), T0);
        const { result } = mount();
        act(() => vi.advanceTimersByTime(10_000));
        act(() => result.current.pause());
        expect(result.current.isPaused).toBe(true);

        act(() => vi.advanceTimersByTime(60_000));
        expect(result.current.elapsedSeconds).toBe(10);

        act(() => result.current.resume());
        act(() => vi.advanceTimersByTime(5_000));
        expect(result.current.elapsedSeconds).toBe(15);
    });

    it("has no status when there is no target (practice, single exercise, missing config)", () => {
        useExamTimerStore.getState().start(session({ mode: "PRACTICE", targetSeconds: null }), T0);
        const { result } = mount();
        act(() => vi.advanceTimersByTime(5_000));
        expect(result.current.status).toBeNull();
        expect(result.current.elapsedSeconds).toBe(5);
    });

    it("shows nothing when no timer is active", () => {
        const { result } = mount();
        expect(result.current.elapsedSeconds).toBe(0);
        expect(result.current.status).toBeNull();
    });
});

describe("useExamTimerStore", () => {
    beforeEach(() => {
        useExamTimerStore.setState({ active: null });
    });

    it("records each announced warning stage once", () => {
        useExamTimerStore.getState().start(session(), T0);
        useExamTimerStore.getState().markAnnounced(["APPROACHING", "TARGET_REACHED"]);
        useExamTimerStore.getState().markAnnounced(["TARGET_REACHED"]);
        expect(useExamTimerStore.getState().active?.announced).toEqual(["APPROACHING", "TARGET_REACHED"]);
    });

    it("ignores pause when nothing runs and double pause/resume", () => {
        useExamTimerStore.getState().pause(T0);
        expect(useExamTimerStore.getState().active).toBeNull();

        useExamTimerStore.getState().start(session(), T0);
        useExamTimerStore.getState().pause(T0 + 1000);
        useExamTimerStore.getState().pause(T0 + 9000);
        expect(useExamTimerStore.getState().active?.pausedAtMs).toBe(T0 + 1000);

        useExamTimerStore.getState().resume(T0 + 11_000);
        useExamTimerStore.getState().resume(T0 + 99_000);
        expect(useExamTimerStore.getState().active?.pausedTotalMs).toBe(10_000);
    });

    it("starting a new run replaces the active one", () => {
        useExamTimerStore.getState().start(session({ id: "a" }), T0);
        useExamTimerStore.getState().start(session({ id: "b" }), T0);
        expect(useExamTimerStore.getState().active?.sessionId).toBe("b");
    });

    it("pauses a run when leaving and resumes it with the earlier time kept", () => {
        useExamTimerStore.getState().start(session({ scope: "EXERCISE", exerciseId: "e1" }), T0);
        useExamTimerStore.getState().pause(T0 + 30_000);
        useExamTimerStore.getState().resume(T0 + 90_000);
        const run = useExamTimerStore.getState().active!;
        expect(elapsedSecondsAt(run, T0 + 100_000)).toBe(40);
    });

    it("counts restart requests", () => {
        useExamTimerStore.getState().requestRestart();
        useExamTimerStore.getState().requestRestart();
        expect(useExamTimerStore.getState().restartSignal).toBe(2);
    });
});

describe("warning messages", () => {
    beforeEach(() => {
        useExamTimerStore.setState({ active: null });
    });

    it("keeps a dismissed message dismissed", () => {
        useExamTimerStore.getState().start(session(), T0);
        useExamTimerStore.getState().dismissWarning("TARGET_REACHED");
        useExamTimerStore.getState().dismissWarning("TARGET_REACHED");
        expect(useExamTimerStore.getState().active?.dismissed).toEqual(["TARGET_REACHED"]);
    });
});
