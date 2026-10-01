import { describe, expect, it } from "vitest";
import {
    cumulativeTargets,
    currentWarningStage,
    elapsedSecondsAt,
    formatClock,
    formatDifference,
    getTimeStatus,
    isTimerStale,
    MAX_ACTIVE_TIMER_AGE_MS,
    pausedSecondsAt,
    stagesUpTo,
    stageToAnnounce,
    zeitCheckMessage,
} from "./examTime";

const MIN = 60;
const TARGET = 20 * MIN;

describe("getTimeStatus", () => {
    it.each([
        ["18:30", 18 * MIN + 30, "ON_TRACK"],
        ["19:59", 20 * MIN - 1, "ON_TRACK"],
        ["20:00", 20 * MIN, "TARGET_REACHED"],
        ["22:00", 22 * MIN, "TARGET_REACHED"],
        ["25:00", 25 * MIN, "TARGET_REACHED"],
        ["25:01", 25 * MIN + 1, "OVER_TIME"],
    ])("%s of a 20:00 target is %s", (_label, elapsed, expected) => {
        expect(getTimeStatus(elapsed, TARGET).status).toBe(expected);
    });

    it("reports the signed difference to the target", () => {
        expect(getTimeStatus(18 * MIN + 42, TARGET).differenceSeconds).toBe(-78);
        expect(getTimeStatus(23 * MIN + 18, TARGET).differenceSeconds).toBe(198);
    });

    it("uses the given thresholds instead of hardcoded ones", () => {
        const strict = { approaching: 0.5, target: 1, overTime: 1.1 };
        expect(getTimeStatus(23 * MIN, TARGET, strict).status).toBe("OVER_TIME");
    });
});

describe("warning stages", () => {
    it("is quiet below 80%", () => {
        expect(currentWarningStage(15 * MIN, TARGET)).toBeNull();
    });

    it("hints at 80%, then target, then over time", () => {
        expect(currentWarningStage(16 * MIN, TARGET)).toBe("APPROACHING");
        expect(currentWarningStage(20 * MIN, TARGET)).toBe("TARGET_REACHED");
        expect(currentWarningStage(25 * MIN + 1, TARGET)).toBe("OVER_TIME");
    });

    it("announces a stage only once", () => {
        expect(stageToAnnounce(20 * MIN, TARGET, [])).toBe("TARGET_REACHED");
        expect(stageToAnnounce(21 * MIN, TARGET, stagesUpTo("TARGET_REACHED"))).toBeNull();
        expect(stageToAnnounce(26 * MIN, TARGET, stagesUpTo("TARGET_REACHED"))).toBe("OVER_TIME");
    });

    it("does not fire an earlier stage late once a later one was announced", () => {
        expect(stagesUpTo("OVER_TIME")).toEqual(["APPROACHING", "TARGET_REACHED", "OVER_TIME"]);
        expect(stageToAnnounce(26 * MIN, TARGET, stagesUpTo("OVER_TIME"))).toBeNull();
    });
});

describe("elapsedSecondsAt", () => {
    const start = Date.UTC(2026, 0, 1, 10, 0, 0);

    it("is derived from timestamps, so a tab asleep for ten minutes does not drift", () => {
        const clock = { startedAtMs: start, pausedAtMs: null, pausedTotalMs: 0 };
        expect(elapsedSecondsAt(clock, start + 10 * 60_000 + 400)).toBe(600);
    });

    it("freezes while paused and ignores time spent paused afterwards", () => {
        const paused = { startedAtMs: start, pausedAtMs: start + 5 * 60_000, pausedTotalMs: 0 };
        expect(elapsedSecondsAt(paused, start + 5 * 60_000)).toBe(300);
        expect(elapsedSecondsAt(paused, start + 50 * 60_000)).toBe(300);

        const resumed = { startedAtMs: start, pausedAtMs: null, pausedTotalMs: 10 * 60_000 };
        expect(elapsedSecondsAt(resumed, start + 15 * 60_000)).toBe(300);
    });

    it("never goes negative if the clock moves backwards", () => {
        expect(elapsedSecondsAt({ startedAtMs: start, pausedAtMs: null, pausedTotalMs: 0 }, start - 5000)).toBe(0);
    });

    it("totals pause time including a pause still in progress", () => {
        const clock = { startedAtMs: start, pausedAtMs: start + 60_000, pausedTotalMs: 120_000 };
        expect(pausedSecondsAt(clock, start + 90_000)).toBe(150);
    });
});

describe("formatting", () => {
    it("formats clocks with unbounded minutes", () => {
        expect(formatClock(0)).toBe("00:00");
        expect(formatClock(754)).toBe("12:34");
        expect(formatClock(90 * MIN)).toBe("90:00");
    });

    it("formats signed differences", () => {
        expect(formatDifference(198)).toBe("+03:18");
        expect(formatDifference(-78)).toBe("-01:18");
        expect(formatDifference(0)).toBe("00:00");
    });
});

describe("cumulativeTargets", () => {
    it("accumulates the per-Teil minutes", () => {
        expect(cumulativeTargets([15, 20, 20, 15, 15])).toEqual([15, 35, 55, 70, 85]);
    });
});

describe("isTimerStale", () => {
    it("drops timers that were left running for a long time", () => {
        const clock = { startedAtMs: 0, pausedAtMs: null, pausedTotalMs: 0 };
        expect(isTimerStale(clock, MAX_ACTIVE_TIMER_AGE_MS)).toBe(false);
        expect(isTimerStale(clock, MAX_ACTIVE_TIMER_AGE_MS + 1)).toBe(true);
    });
});

describe("zeitCheckMessage", () => {
    it("reports a run within the recommended time", () => {
        const m = zeitCheckMessage({ elapsedSeconds: 18 * MIN + 42, targetSeconds: TARGET, differenceSeconds: -78 });
        expect(m.tone).toBe("within");
        expect(m.lines).toEqual(["Deine Zeit: 18:42 · Empfohlen: 20:00 · Unterschied: -01:18", "Innerhalb der Vorgabe"]);
    });

    it("reports how much longer an over-time run took", () => {
        const m = zeitCheckMessage({ elapsedSeconds: 23 * MIN + 18, targetSeconds: TARGET, differenceSeconds: 198 });
        expect(m.tone).toBe("over");
        expect(m.lines[1]).toBe("Du hast 3:18 länger gebraucht als empfohlen.");
    });

    it("treats finishing exactly on the target as within", () => {
        expect(zeitCheckMessage({ elapsedSeconds: TARGET, targetSeconds: TARGET, differenceSeconds: 0 }).tone).toBe("within");
    });

    it("only shows the time when there is no target", () => {
        const m = zeitCheckMessage({ elapsedSeconds: 754, targetSeconds: null, differenceSeconds: null });
        expect(m).toEqual({ title: "Zeit-Check", lines: ["Deine Zeit: 12:34"], tone: "plain" });
    });
});
