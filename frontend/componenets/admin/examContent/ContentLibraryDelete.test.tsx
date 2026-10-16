// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ContentLibrary from "./ContentLibrary";

const list = vi.fn();
const remove = vi.fn();
vi.mock("@/services/adminExamService", () => ({
    getExamExercisesForAdmin: (p: unknown) => list(p),
    getExamExerciseForAdmin: vi.fn(),
    deleteExamExercise: (id: string) => remove(id),
}));
vi.mock("@/services/adminExamContentService", () => ({ changeExamContentStatus: vi.fn(), downloadExamContentExport: vi.fn() }));
vi.mock("@/store/useAuthStore", () => ({ default: () => ({ userProfile: { role: "ADMIN" }, hasHydrated: true }) }));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./ExamContentShell", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

const row = (id: string, title: string, status: string) => ({
    id, title, section: "MUENDLICHER_AUSDRUCK", taskType: "PHOTO_EXPERIENCE", level: "B1", partNumber: 2, published: status === "PUBLISHED", questionCount: 0,
    examType: "DTZ", status, externalId: null, version: 1, difficulty: "A2_B1", updatedAt: null, topic: "x", createdAt: null,
});

function renderLibrary() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={client}><ContentLibrary /></QueryClientProvider>);
}

beforeEach(() => {
    list.mockReset();
    remove.mockReset();
    remove.mockResolvedValue({});
    list.mockResolvedValue({ data: [row("a", "Entwurf eins", "DRAFT"), row("b", "Entwurf zwei", "DRAFT"), row("c", "Live Übung", "PUBLISHED")] });
});
afterEach(cleanup);

describe("Content Library delete", () => {
    it("asks for confirmation, then deletes the exercise", async () => {
        renderLibrary();
        fireEvent.click(await screen.findByRole("button", { name: "Delete Entwurf eins" }));
        const dialog = screen.getByRole("alertdialog");
        expect(within(dialog).getByText("Delete 1 exercise?")).toBeTruthy();
        expect(within(dialog).getByText(/cannot be undone/)).toBeTruthy();
        expect(remove).not.toHaveBeenCalled();
        fireEvent.click(within(dialog).getByRole("button", { name: "Delete permanently" }));
        await waitFor(() => expect(remove).toHaveBeenCalledWith("a"));
        expect(screen.queryByRole("alertdialog")).toBeNull();
    });

    it("does nothing when the confirmation is cancelled", async () => {
        renderLibrary();
        fireEvent.click(await screen.findByRole("button", { name: "Delete Entwurf eins" }));
        fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel" }));
        expect(screen.queryByRole("alertdialog")).toBeNull();
        expect(remove).not.toHaveBeenCalled();
    });

    it("can delete a published exercise after a stronger warning", async () => {
        renderLibrary();
        const button = (await screen.findByRole("button", { name: "Delete Live Übung" })) as HTMLButtonElement;
        expect(button.disabled).toBe(false);
        fireEvent.click(button);
        const dialog = screen.getByRole("alertdialog");
        expect(within(dialog).getByText(/published and live for learners/)).toBeTruthy();
        fireEvent.click(within(dialog).getByRole("button", { name: "Delete permanently" }));
        await waitFor(() => expect(remove).toHaveBeenCalledWith("c"));
    });

    it("deletes a whole selection in bulk", async () => {
        renderLibrary();
        await screen.findByText("Entwurf eins");
        fireEvent.click(screen.getByRole("checkbox", { name: "Select all on this page" }));
        fireEvent.click(screen.getByRole("button", { name: /^Delete$/ }));
        const dialog = screen.getByRole("alertdialog");
        expect(within(dialog).getByText("Delete 3 exercises?")).toBeTruthy();
        fireEvent.click(within(dialog).getByRole("button", { name: "Delete permanently" }));
        await waitFor(() => expect(remove).toHaveBeenCalledTimes(3));
        expect(remove.mock.calls.map((c) => c[0]).sort()).toEqual(["a", "b", "c"]);
    });

    it("keeps going when one delete fails", async () => {
        remove.mockImplementation((id: string) => (id === "a" ? Promise.reject(new Error("x")) : Promise.resolve({})));
        renderLibrary();
        await screen.findByText("Entwurf eins");
        fireEvent.click(screen.getByRole("checkbox", { name: "Select all on this page" }));
        fireEvent.click(screen.getByRole("button", { name: /^Delete$/ }));
        fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete permanently" }));
        await waitFor(() => expect(remove).toHaveBeenCalledTimes(3));
    });
});
