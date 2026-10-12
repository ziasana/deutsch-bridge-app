// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useExamAutosave } from "./useExamAutosave";
import { saveSimulationAnswers } from "@/services/examSimulationService";

vi.mock("@/services/examSimulationService", () => ({ saveSimulationAnswers: vi.fn() }));

const save = vi.mocked(saveSimulationAnswers);
const ok = (over: object = {}) =>
    Promise.resolve({ data: { saved: 1, rejected: [], status: "IN_PROGRESS", serverNowMs: 0, currentStageIndex: 0, remainingSeconds: 100, timeUp: false, ...over } } as never);

function mount() {
    const onRejected = vi.fn();
    const onFinished = vi.fn();
    const hook = renderHook(() => useExamAutosave({ attemptId: "a1", onRejected, onFinished }));
    return { ...hook, onRejected, onFinished };
}

describe("useExamAutosave", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        save.mockReset();
    });
    afterEach(() => vi.useRealTimers());

    it("batches edits and only sends the latest value per question", async () => {
        save.mockImplementation(() => ok());
        const { result } = mount();
        act(() => {
            result.current.enqueue({ partKey: "LESEN_1", questionId: "q1", answer: "A", flagged: false });
            result.current.enqueue({ partKey: "LESEN_1", questionId: "q1", answer: "B", flagged: true });
            result.current.enqueue({ partKey: "LESEN_1", questionId: "q2", answer: "C", flagged: false });
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(700);
        });
        expect(save).toHaveBeenCalledTimes(1);
        const items = save.mock.calls[0][1];
        expect(items).toHaveLength(2);
        expect(items.find((i) => i.questionId === "q1")).toMatchObject({ answer: "B", flagged: true });
        expect(result.current.status).toBe("saved");
        expect(result.current.pendingCount()).toBe(0);
    });

    it("keeps answers queued while the network is down and retries until they are saved", async () => {
        save.mockRejectedValueOnce(new Error("offline")).mockRejectedValueOnce(new Error("offline")).mockImplementation(() => ok());
        const { result } = mount();
        act(() => result.current.enqueue({ partKey: "LESEN_1", questionId: "q1", answer: "A", flagged: false }));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(700);
        });
        expect(result.current.status).toBe("retrying");
        expect(result.current.pendingCount()).toBe(1);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2100);
        });
        expect(save).toHaveBeenCalledTimes(2);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(4100);
        });
        expect(save).toHaveBeenCalledTimes(3);
        expect(result.current.status).toBe("saved");
        expect(result.current.pendingCount()).toBe(0);
    });

    it("stamps edits so a newer answer is never overwritten by an older retry", async () => {
        save.mockImplementation(() => ok());
        const { result } = mount();
        act(() => {
            result.current.enqueue({ partKey: "P", questionId: "q", answer: "A", flagged: false });
            result.current.enqueue({ partKey: "P", questionId: "q", answer: "B", flagged: false });
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(700);
        });
        act(() => result.current.enqueue({ partKey: "P", questionId: "q", answer: "C", flagged: false }));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(700);
        });
        const [first, second] = save.mock.calls.map((c) => c[1][0]);
        expect(second.clientTs).toBeGreaterThan(first.clientTs);
    });

    it("reports rejected answers and a finished exam", async () => {
        save.mockImplementation(() => ok({ rejected: [{ partKey: "LESEN_1", questionId: "q1", reason: "SECTION_LOCKED" }], timeUp: true }));
        const { result, onRejected, onFinished } = mount();
        act(() => result.current.enqueue({ partKey: "LESEN_1", questionId: "q1", answer: "A", flagged: false }));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(700);
        });
        expect(onRejected).toHaveBeenCalledWith([{ partKey: "LESEN_1", questionId: "q1", reason: "SECTION_LOCKED" }]);
        expect(onFinished).toHaveBeenCalled();
    });

    it("stops retrying when the server says the attempt is no longer active (409)", async () => {
        save.mockRejectedValue({ response: { data: { message: "expired", status: 409, code: "EXAM_EXPIRED" } } });
        const { result, onFinished } = mount();
        act(() => result.current.enqueue({ partKey: "P", questionId: "q", answer: "A", flagged: false }));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(700);
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(20_000);
        });
        expect(save).toHaveBeenCalledTimes(1);
        expect(onFinished).toHaveBeenCalled();
        expect(result.current.pendingCount()).toBe(0);
    });
});
