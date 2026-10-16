// @vitest-environment jsdom
import { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useExamTimeConfiguration } from "./useExamTimeConfiguration";

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/services/examTimeService", () => ({ getExamTimeConfigurations: api.get }));

function wrapper() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    };
}

describe("useExamTimeConfiguration", () => {
    beforeEach(() => api.get.mockReset());

    it("asks for the Teil time of the given exam and returns its minutes", async () => {
        api.get.mockResolvedValue({ data: [{ examType: "DTZ", level: "B1", section: "MUENDLICHER_AUSDRUCK", teil: 2, recommendedMinutes: 4 }] });
        const { result } = renderHook(() => useExamTimeConfiguration("B1", "MUENDLICHER_AUSDRUCK", 2, "DTZ"), { wrapper: wrapper() });
        await waitFor(() => expect(result.current.minutes).toBe(4));
        expect(api.get).toHaveBeenCalledWith("B1", "DTZ");
    });

    it("defaults to Telc and has no minutes for a Teil without a configuration", async () => {
        api.get.mockResolvedValue({ data: [] });
        const { result } = renderHook(() => useExamTimeConfiguration("B1", "LESEVERSTEHEN", 1), { wrapper: wrapper() });
        await waitFor(() => expect(api.get).toHaveBeenCalledWith("B1", "TELC"));
        expect(result.current.minutes).toBeNull();
    });
});
