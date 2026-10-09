// @vitest-environment jsdom
import { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSpeakingLearnProgress } from "./useSpeakingLearnProgress";

const api = vi.hoisted(() => ({
    get: vi.fn(),
    save: vi.fn(),
    reset: vi.fn(),
}));
vi.mock("@/services/speakingLearnProgressService", () => ({
    getSpeakingLearnProgress: api.get,
    saveSpeakingLearnProgress: api.save,
    resetSpeakingLearnProgress: api.reset,
}));

function wrapper() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }
    return Wrapper;
}

describe("useSpeakingLearnProgress", () => {
    beforeEach(() => {
        localStorage.clear();
        api.get.mockReset().mockResolvedValue({ data: [] });
        api.save.mockReset().mockImplementation((_l, part, station, correct, total) => Promise.resolve({ data: { part, station, correct, total } }));
        api.reset.mockReset().mockResolvedValue({});
    });

    it("shows the server's finished stations of this Teil only", async () => {
        api.get.mockResolvedValue({ data: [{ part: 1, station: "tipps", correct: 2, total: 3 }, { part: 2, station: "ablauf", correct: 0, total: 0 }] });
        const { result } = renderHook(() => useSpeakingLearnProgress("B1", 1), { wrapper: wrapper() });
        await waitFor(() => expect(result.current.done.tipps).toEqual({ correct: 2, total: 3 }));
        expect(result.current.done.ablauf).toBeUndefined();
    });

    it("saves a finished station to the server and remembers it locally", async () => {
        const { result } = renderHook(() => useSpeakingLearnProgress("B1", 2), { wrapper: wrapper() });
        await waitFor(() => expect(api.get).toHaveBeenCalled());
        act(() => result.current.markDone("redemittel", { correct: 3, total: 4 }));
        expect(api.save).toHaveBeenCalledWith("B1", 2, "redemittel", 3, 4);
        expect(result.current.done.redemittel).toEqual({ correct: 3, total: 4 });
        expect(JSON.parse(localStorage.getItem("speaking-learn-progress-B1-2")!).redemittel).toEqual({ correct: 3, total: 4 });
    });

    it("keeps the better result when a station is repeated", async () => {
        const { result } = renderHook(() => useSpeakingLearnProgress("B1", 1), { wrapper: wrapper() });
        act(() => result.current.markDone("fragen", { correct: 4, total: 4 }));
        api.save.mockResolvedValue({ data: { part: 1, station: "fragen", correct: 4, total: 4 } });
        act(() => result.current.markDone("fragen", { correct: 1, total: 4 }));
        expect(result.current.done.fragen).toEqual({ correct: 4, total: 4 });
    });

    it("works offline: the browser copy still counts when the server fails", async () => {
        api.get.mockRejectedValue(new Error("offline"));
        api.save.mockRejectedValue(new Error("offline"));
        const { result } = renderHook(() => useSpeakingLearnProgress("B1", 3), { wrapper: wrapper() });
        act(() => result.current.markDone("tipps", { correct: 0, total: 0 }));
        expect(result.current.done.tipps).toEqual({ correct: 0, total: 0 });
    });

    it("uploads stations that exist only in this browser", async () => {
        localStorage.setItem("speaking-learn-progress-B1-1", JSON.stringify({ ablauf: { correct: 0, total: 0 } }));
        renderHook(() => useSpeakingLearnProgress("B1", 1), { wrapper: wrapper() });
        await waitFor(() => expect(api.save).toHaveBeenCalledWith("B1", 1, "ablauf", 0, 0));
    });

    it("reset clears the Teil on the server and in the browser", async () => {
        const { result } = renderHook(() => useSpeakingLearnProgress("B1", 1), { wrapper: wrapper() });
        act(() => result.current.markDone("tipps", { correct: 1, total: 1 }));
        act(() => result.current.reset());
        expect(api.reset).toHaveBeenCalledWith("B1", 1);
        expect(result.current.done).toEqual({});
        expect(localStorage.getItem("speaking-learn-progress-B1-1")).toBeNull();
    });
});
