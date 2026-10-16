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
    window.history.replaceState(null, "", "/admin/exam-prep/dtz-muendlich");
});
afterEach(cleanup);

describe("DTZ Mündliche Prüfung admin page", () => {
    it("shows the three parts as tabs", async () => {
        renderManager();
        expect(screen.getByRole("heading", { name: "DTZ A2–B1 · Mündliche Prüfung" })).toBeTruthy();
        const tabs = screen.getAllByRole("tab").map((t) => t.textContent);
        expect(tabs).toEqual(["Teil 1 — Über sich sprechen", "Teil 2 — Über Erfahrungen sprechen", "Teil 3 — Gemeinsam etwas planen"]);
        await waitFor(() => expect(list).toHaveBeenCalled());
    });

    it("loads the exercises of the selected part only (DTZ, Mündlich, part number)", async () => {
        renderManager();
        await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ examType: "DTZ", section: "MUENDLICHER_AUSDRUCK", partNumber: "1" })));
        fireEvent.click(screen.getByRole("tab", { name: /Teil 3/ }));
        await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ partNumber: "3" })));
        expect(screen.getByRole("tab", { name: /Teil 3/ }).getAttribute("aria-selected")).toBe("true");
    });

    it("opens the editor of the active part", async () => {
        renderManager();
        fireEvent.click(screen.getByRole("tab", { name: /Teil 2/ }));
        await screen.findByText("Einkaufen im Internet");
        fireEvent.click(screen.getByRole("button", { name: /Create manually/ }));
        expect(screen.getByText("Editor Teil 2 new")).toBeTruthy();
    });

    it("lists title, part, topic, difficulty, image status, publication status and creation date for Teil 2", async () => {
        renderManager();
        fireEvent.click(screen.getByRole("tab", { name: /Teil 2/ }));
        await screen.findByText("Einkaufen im Internet");
        for (const header of ["Title", "Part", "Topic", "Difficulty", "Image", "Status", "Created"]) {
            expect(screen.getByRole("columnheader", { name: header })).toBeTruthy();
        }
        const cells = within(screen.getAllByRole("row")[1]);
        expect(cells.getByText("Teil 2")).toBeTruthy();
        expect(cells.getByText("Einkaufen")).toBeTruthy();
        expect(cells.getByText("A2–B1")).toBeTruthy();
        expect(cells.getByText("Missing")).toBeTruthy();
        expect(cells.getByText("13.10.2026")).toBeTruthy();
    });

    it("has no topic or image column in Teil 1", async () => {
        list.mockResolvedValue({ data: [row({ id: "t1", title: "Über sich sprechen", partNumber: 1, taskType: "SELF_INTRODUCTION", topic: null })] });
        renderManager();
        await screen.findByText("Über sich sprechen");
        expect(screen.queryByRole("columnheader", { name: "Topic" })).toBeNull();
        expect(screen.queryByRole("columnheader", { name: "Image" })).toBeNull();
    });

    it("cannot publish a Teil 2 exercise without an image, but can once it has one", async () => {
        renderManager();
        fireEvent.click(screen.getByRole("tab", { name: /Teil 2/ }));
        await screen.findByText("Einkaufen im Internet");
        const publish = screen.getByRole("button", { name: /Publish/ }) as HTMLButtonElement;
        expect(publish.disabled).toBe(true);
        fireEvent.click(publish);
        expect(changeStatus).not.toHaveBeenCalled();

        cleanup();
        list.mockResolvedValue({ data: [row({ hasImage: true })] });
        renderManager();
        fireEvent.click(screen.getByRole("tab", { name: /Teil 2/ }));
        await screen.findByText("Einkaufen im Internet");
        fireEvent.click(screen.getByRole("button", { name: /Publish/ }));
        await waitFor(() => expect(changeStatus).toHaveBeenCalledTimes(2));
        expect(changeStatus.mock.calls.map((c) => c[1])).toEqual(["APPROVED", "PUBLISHED"]);
    });

    it("archives and unpublishes", async () => {
        list.mockResolvedValue({ data: [row({ hasImage: true, status: "PUBLISHED" })] });
        renderManager();
        fireEvent.click(screen.getByRole("tab", { name: /Teil 2/ }));
        await screen.findByText("Einkaufen im Internet");
        fireEvent.click(screen.getByRole("button", { name: /Archive/ }));
        await waitFor(() => expect(changeStatus).toHaveBeenCalledWith(["o1"], "ARCHIVED"));
        changeStatus.mockClear();
        fireEvent.click(screen.getByRole("button", { name: "Unpublish" }));
        await waitFor(() => expect(changeStatus).toHaveBeenCalledWith(["o1"], "DRAFT"));
    });

    it("opens the preview of a row", async () => {
        renderManager();
        fireEvent.click(screen.getByRole("tab", { name: /Teil 2/ }));
        await screen.findByText("Einkaufen im Internet");
        fireEvent.click(screen.getByRole("button", { name: /Preview/ }));
        expect(screen.getByText("Preview Einkaufen im Internet")).toBeTruthy();
    });

    it("creates the standard Teil 1 template", async () => {
        list.mockResolvedValue({ data: [] });
        renderManager();
        fireEvent.click(await screen.findByRole("button", { name: /Create standard template/ }));
        await waitFor(() => expect(createTemplate).toHaveBeenCalledTimes(1));
    });

    it("opens a part and exercise from the Content Library deep link", async () => {
        window.history.replaceState(null, "", "/admin/exam-prep/dtz-muendlich?part=3&edit=o9");
        renderManager();
        expect(await screen.findByText("Editor Teil 3 o9")).toBeTruthy();
        expect(screen.getByRole("tab", { name: /Teil 3/ }).getAttribute("aria-selected")).toBe("true");
    });
});
