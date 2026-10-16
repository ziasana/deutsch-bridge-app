// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DtzWritingManager from "./DtzWritingManager";

const list = vi.fn();
const changeStatus = vi.fn();
vi.mock("@/services/adminExamService", () => ({ getExamExercisesForAdmin: (params: unknown) => list(params), getExamExerciseForAdmin: vi.fn() }));
vi.mock("@/services/adminExamContentService", () => ({
    changeExamContentStatus: (ids: string[], status: string) => changeStatus(ids, status),
    createWritingChoice: vi.fn(),
    updateWritingChoice: vi.fn(),
}));
vi.mock("@/store/useAuthStore", () => ({ default: () => ({ userProfile: { role: "ADMIN" }, hasHydrated: true }) }));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/componenets/admin/examContent/ExamContentShell", () => ({
    default: ({ title, children }: { title: string; children: React.ReactNode }) => <div><h1>{title}</h1>{children}</div>,
}));
vi.mock("@/componenets/admin/examContent/ContentLibrary", () => ({ PreviewDialog: ({ row }: { row: { title: string } }) => <div role="dialog">Preview {row.title}</div> }));
vi.mock("./DtzWritingChoiceEditor", () => ({
    default: ({ exerciseId }: { exerciseId?: string | null }) => <div role="dialog">Editor {exerciseId ?? "new"}</div>,
}));

const row = (over: Record<string, unknown> = {}) => ({
    id: "w1", title: "Schriftliche Kommunikation im Alltag", section: "SCHRIFTLICHER_AUSDRUCK", taskType: "WRITING_TASK_CHOICE", level: "B1", partNumber: 1,
    published: false, questionCount: 0, examType: "DTZ", status: "DRAFT", externalId: null, version: 1, difficulty: "A2_B1", updatedAt: null,
    topic: "Kurse und Bildung / Wohnen und Nachbarn", sourceType: "FORMAL_EMAIL, INFORMAL_EMAIL", createdAt: "2026-10-13T08:00:00", passageCount: 2, wordCount: 120, ...over,
});

function renderManager() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={client}><DtzWritingManager /></QueryClientProvider>);
}

beforeEach(() => {
    list.mockReset();
    changeStatus.mockReset();
    list.mockResolvedValue({ data: [row()] });
    changeStatus.mockResolvedValue({ data: { failures: [] } });
    window.history.replaceState(null, "", "/admin/exam-prep/schriftlicher-ausdruck?exam=DTZ");
});
afterEach(cleanup);

async function search() {
    fireEvent.click(await screen.findByRole("button", { name: /Search/ }));
    await screen.findByText("Schriftliche Kommunikation im Alltag");
}

describe("DTZ Schreiben admin page", () => {
    it("uses the shared exercise list: nothing is loaded until Search, then DTZ Schreiben is listed", async () => {
        renderManager();
        expect(screen.getByRole("heading", { name: "DTZ A2–B1 · Schreiben" })).toBeTruthy();
        expect(list).not.toHaveBeenCalled();
        await search();
        expect(list).toHaveBeenCalledWith(expect.objectContaining({ examType: "DTZ", section: "SCHRIFTLICHER_AUSDRUCK" }));
        const cells = within(screen.getAllByRole("row")[1]);
        expect(cells.getByText("DTZ A2–B1")).toBeTruthy();
        expect(cells.getByText(/Draft/i)).toBeTruthy();
    });

    it("offers generate, import and create manually, and edits a row in the writing editor", async () => {
        renderManager();
        expect(screen.getByRole("link", { name: /Generate with external AI/ }).getAttribute("href")).toBe("/admin/exam-prep/content-generator?exam=DTZ&section=SCHREIBEN&part=TEIL_1");
        expect(screen.getByRole("link", { name: /Import JSON/ }).getAttribute("href")).toBe("/admin/exam-prep/import");
        fireEvent.click(screen.getByRole("button", { name: /Create manually/ }));
        expect(screen.getByText("Editor new")).toBeTruthy();
        cleanup();
        renderManager();
        await search();
        fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
        expect(screen.getByText("Editor w1")).toBeTruthy();
    });

    it("opens the editor from the Content Library deep link", async () => {
        window.history.replaceState(null, "", "/admin/exam-prep/schriftlicher-ausdruck?exam=DTZ&edit=w9");
        renderManager();
        expect(await screen.findByText("Editor w9")).toBeTruthy();
    });
});
