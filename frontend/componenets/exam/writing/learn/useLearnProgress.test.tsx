// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLearnProgress } from "./useLearnProgress";

const service = vi.hoisted(() => ({
    getWritingLearnProgress: vi.fn(),
    saveWritingLearnProgress: vi.fn(),
    resetWritingLearnProgress: vi.fn(),
}));
vi.mock("@/services/writingLearnProgressService", () => service);

const wrapper = ({ children }: { children: ReactNode }) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

beforeEach(() => {
    localStorage.clear();
    service.getWritingLearnProgress.mockReset().mockResolvedValue({ data: [] });
    service.saveWritingLearnProgress.mockReset().mockImplementation((_l: string, station: string, correct: number, total: number) => Promise.resolve({ data: { station, correct, total } }));
    service.resetWritingLearnProgress.mockReset().mockResolvedValue({});
});
afterEach(() => localStorage.clear());

describe("useLearnProgress", () => {
    it("shows server progress (from another device)", async () => {
        service.getWritingLearnProgress.mockResolvedValue({ data: [{ station: "aufbau", correct: 3, total: 4 }] });
        const { result } = renderHook(() => useLearnProgress("B1"), { wrapper });
        await waitFor(() => expect(result.current.done.aufbau).toEqual({ correct: 3, total: 4 }));
    });

    it("uploads progress that only exists in this browser, once", async () => {
        localStorage.setItem("writing-learn-progress-B1", JSON.stringify({ format: { correct: 0, total: 0 } }));
        renderHook(() => useLearnProgress("B1"), { wrapper });
        await waitFor(() => expect(service.saveWritingLearnProgress).toHaveBeenCalledWith("B1", "format", 0, 0));
        expect(service.saveWritingLearnProgress).toHaveBeenCalledTimes(1);
    });

    it("saves a finished station to the server and keeps a local copy", async () => {
        const { result } = renderHook(() => useLearnProgress("B1"), { wrapper });
        await waitFor(() => expect(service.getWritingLearnProgress).toHaveBeenCalled());
        act(() => result.current.markDone("fehler", { correct: 2, total: 5 }));
        expect(service.saveWritingLearnProgress).toHaveBeenCalledWith("B1", "fehler", 2, 5);
        await waitFor(() => expect(result.current.done.fehler).toEqual({ correct: 2, total: 5 }));
        expect(JSON.parse(localStorage.getItem("writing-learn-progress-B1")!).fehler).toEqual({ correct: 2, total: 5 });
    });

    it("keeps the finished station when the server is unreachable", async () => {
        service.saveWritingLearnProgress.mockRejectedValue(new Error("offline"));
        const { result } = renderHook(() => useLearnProgress("B1"), { wrapper });
        act(() => result.current.markDone("aufbau", { correct: 1, total: 2 }));
        await waitFor(() => expect(result.current.done.aufbau).toEqual({ correct: 1, total: 2 }));
    });

    it("reset clears the server and the browser copy", async () => {
        service.getWritingLearnProgress.mockResolvedValue({ data: [{ station: "aufbau", correct: 3, total: 4 }] });
        const { result } = renderHook(() => useLearnProgress("B1"), { wrapper });
        await waitFor(() => expect(result.current.done.aufbau).toBeDefined());
        act(() => result.current.reset());
        expect(service.resetWritingLearnProgress).toHaveBeenCalledWith("B1");
        await waitFor(() => expect(result.current.done.aufbau).toBeUndefined());
    });
});
