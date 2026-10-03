// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const service = vi.hoisted(() => ({
    getAdminRedemittelExercises: vi.fn(),
    saveAdminRedemittelExercises: vi.fn(),
}));
vi.mock("@/services/adminWritingService", () => service);
vi.mock("@/lib/toast", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import RedemittelExerciseEditor from "./RedemittelExerciseEditor";

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

function setup(existing: unknown[] = []) {
    service.getAdminRedemittelExercises.mockResolvedValue({ data: existing });
    service.saveAdminRedemittelExercises.mockImplementation((_id: string, list: unknown[]) => Promise.resolve({ data: list }));
    render(
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <RedemittelExerciseEditor phraseId="p1" />
        </QueryClientProvider>,
    );
}

describe("RedemittelExerciseEditor", () => {
    it("explains which exercises are derived automatically", async () => {
        setup();
        expect(await screen.findByText(/automatisch/)).toBeTruthy();
        expect((screen.getByRole("button", { name: "Übungen speichern" }) as HTMLButtonElement).disabled).toBe(true);
    });

    it("authors a meaning exercise with wrong answers and saves the whole set", async () => {
        setup();
        await screen.findByText(/automatisch/);
        fireEvent.click(screen.getByRole("button", { name: "+ Bedeutung" }));
        fireEvent.change(screen.getByLabelText("Richtige Antwort"), { target: { value: "I think that …" } });
        fireEvent.change(screen.getByLabelText(/Falsche Antworten/), { target: { value: "I am sorry\nI agree" } });
        fireEvent.click(screen.getByRole("button", { name: "Übungen speichern" }));

        await waitFor(() => expect(service.saveAdminRedemittelExercises).toHaveBeenCalledTimes(1));
        const [id, list] = service.saveAdminRedemittelExercises.mock.calls[0];
        expect(id).toBe("p1");
        expect(list).toEqual([expect.objectContaining({ type: "MEANING", correctAnswer: "I think that …", wrongAnswers: ["I am sorry", "I agree"], sortOrder: 0 })]);
    });

    it("shows type-specific fields: a blank sentence for fill-blank, only a topic for production", async () => {
        setup();
        await screen.findByText(/automatisch/);
        fireEvent.click(screen.getByRole("button", { name: "+ Lücke" }));
        expect(screen.getByLabelText("Satz mit Lücke (___)")).toBeTruthy();
        expect(screen.getByLabelText("Fehlendes Wort")).toBeTruthy();
        expect(screen.queryByLabelText(/Falsche Antworten/)).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "+ Eigener Satz" }));
        expect(screen.getByLabelText("Thema")).toBeTruthy();
    });

    it("loads existing exercises and can remove one", async () => {
        setup([{ id: "e1", type: "PRODUCTION", prompt: "Ein Thema", correctAnswer: null, wrongAnswers: [], sortOrder: 0 }]);
        expect(await screen.findByDisplayValue("Ein Thema")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Entfernen" }));
        expect(screen.queryByDisplayValue("Ein Thema")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Übungen speichern" }));
        await waitFor(() => expect(service.saveAdminRedemittelExercises).toHaveBeenCalledWith("p1", []));
    });
});
