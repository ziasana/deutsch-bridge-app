import { afterEach, describe, expect, it, vi } from "vitest";
import { stashAttemptState, takeAttemptState } from "./simulationHandoff";
import type { AttemptState } from "@/types/examSimulation";

const state = (attemptId: string) => ({ attemptId }) as unknown as AttemptState;

describe("simulation handoff", () => {
    afterEach(() => vi.useRealTimers());

    it("hands the started state over once", () => {
        stashAttemptState(state("a1"));
        expect(takeAttemptState("a1")?.attemptId).toBe("a1");
        expect(takeAttemptState("a1")).toBeNull();
    });

    it("knows nothing about other attempts", () => {
        stashAttemptState(state("a2"));
        expect(takeAttemptState("other")).toBeNull();
        expect(takeAttemptState("a2")).not.toBeNull();
    });

    it("does not trust a state that is too old", () => {
        vi.useFakeTimers();
        stashAttemptState(state("a3"));
        vi.advanceTimersByTime(61_000);
        expect(takeAttemptState("a3")).toBeNull();
    });
});
