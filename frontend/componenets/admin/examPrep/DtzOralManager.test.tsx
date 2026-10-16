// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DtzOralManager from "./DtzOralManager";

const list = vi.fn();
const changeStatus = vi.fn();
const createTemplate = vi.fn();
vi.mock("@/services/adminExamService", () => ({ getExamExercisesForAdmin: (params: unknown) => list(params), getExamExerciseForAdmin: vi.fn(), uploadExamPassageImage: vi.fn() }));
vi.mock("@/services/adminExamContentService", () => ({
    changeExamContentStatus: (ids: string[], status: string) => changeStatus(ids, status),
    createDtzOralTemplate: () => createTemplate(),
    createDtzOral: vi.fn(),
    updateDtzOral: vi.fn(),
    generateExamContentPrompt: vi.fn(),
    validateExamContent: vi.fn(),
    importExamContent: vi.fn(),
}));
vi.mock("@/store/useAuthStore", () => ({ default: () => ({ userProfile: { role: "ADMIN" }, hasHydrated: true }) }));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/componenets/admin/examContent/ExamContentShell", () => ({
    default: ({ title, children }: { title: string; children: React.ReactNode }) => <div><h1>{title}</h1>{children}</div>,
}));
vi.mock("@/componenets/admin/examContent/ContentLibrary", () => ({ PreviewDialog: ({ row }: { row: { title: string } }) => <div role="dialog">Preview {row.title}</div> }));
vi.mock("./DtzOralEditor", () => ({
    default: ({ part, exerciseId }: { part: number; exerciseId?: string | null }) => <div role="dialog">Editor Teil {part} {exerciseId ?? "new"}</div>,
}));

const row = (over: Record<string, unknown> = {}) => ({
    id: "o1", title: "Einkaufen im Internet", section: "MUENDLICHER_AUSDRUCK", taskType: "PHOTO_EXPERIENCE", level: "B1", partNumber: 2,
    published: false, questionCount: 0, examType: "DTZ", status: "DRAFT", externalId: null, version: 1, difficulty: "A2_B1", updatedAt: null,
    topic: "Einkaufen", sourceType: null, createdAt: "2026-10-13T08:00:00", passageCount: 1, wordCount: 40, hasImage: false, ...over,
});

function renderManager() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={client}><DtzOralManager /></QueryClientProvider>);
}

beforeEach(() => {
    list.mockReset();
    changeStatus.mockReset();
    createTemplate.mockReset();
    list.mockResolvedValue({ data: [row()] });
    changeStatus.mockResolvedValue({ data: { failures: [] } });
    createTemplate.mockResolvedValue({ data: { id: "t1", warnings: [] } });
    window.history.replaceState(null, "", "/admin/exam-prep/muendlicher-ausdruck?exam=DTZ");
});
afterEach(cleanup);

describe("DTZ Mündliche Prüfung admin page", () => {
    it("shows the three parts as tabs for the tools and lists all Teile in the shared exercise list", async () => {
        renderManager();
        expect(screen.getByRole("heading", { name: "DTZ A2–B1 · Mündliche Prüfung" })).toBeTruthy();
        const tabs = screen.getAllByRole("tab").map((t) => t.textContent);
        expect(tabs).toEqual(["Teil 1 — Über sich sprechen", "Teil 2 — Über Erfahrungen sprechen", "Teil 3 — Gemeinsam etwas planen"]);
        expect(list).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole("button", { name: /Search/ }));
        await screen.findByText("Einkaufen im Internet");
        expect(list).toHaveBeenCalledWith(expect.objectContaining({ examType: "DTZ", section: "MUENDLICHER_AUSDRUCK" }));
        expect(within(screen.getAllByRole("row")[1]).getByText("Teil 2")).toBeTruthy();
    });

    it("opens the editor of the active part", async () => {
        renderManager();
        fireEvent.click(screen.getByRole("tab", { name: /Teil 2/ }));
        fireEvent.click(screen.getByRole("button", { name: /Create manually/ }));
        expect(screen.getByText("Editor Teil 2 new")).toBeTruthy();
    });

    it("edits a row in the editor of its own Teil, switching the tab when needed", async () => {
        renderManager();
        fireEvent.click(screen.getByRole("button", { name: /Search/ }));
        await screen.findByText("Einkaufen im Internet");
        fireEvent.click(screen.getByRole("button", { name: "Edit" }));
        expect(await screen.findByText("Editor Teil 2 o1")).toBeTruthy();
        expect(screen.getByRole("tab", { name: /Teil 2/ }).getAttribute("aria-selected")).toBe("true");
    });

    it("creates the standard Teil 1 template", async () => {
        renderManager();
        fireEvent.click(await screen.findByRole("button", { name: /Create standard template/ }));
        await waitFor(() => expect(createTemplate).toHaveBeenCalledTimes(1));
    });

    it("opens a part and exercise from the Content Library deep link", async () => {
        window.history.replaceState(null, "", "/admin/exam-prep/muendlicher-ausdruck?exam=DTZ&part=3&edit=o9");
        renderManager();
        expect(await screen.findByText("Editor Teil 3 o9")).toBeTruthy();
        expect(screen.getByRole("tab", { name: /Teil 3/ }).getAttribute("aria-selected")).toBe("true");
    });
});
