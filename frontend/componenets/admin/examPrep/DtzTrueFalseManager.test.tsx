// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DtzDirectoryManager from "./DtzDirectoryManager";

const list = vi.fn();
const changeStatus = vi.fn();
vi.mock("@/services/adminExamService", () => ({ getExamExercisesForAdmin: (params: unknown) => list(params) }));
vi.mock("@/services/adminExamContentService", () => ({ changeExamContentStatus: (ids: string[], status: string) => changeStatus(ids, status) }));
vi.mock("@/store/useAuthStore", () => ({ default: () => ({ userProfile: { role: "ADMIN" }, hasHydrated: true }) }));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/componenets/admin/examContent/ExamContentShell", () => ({
    default: ({ title, children }: { title: string; children: React.ReactNode }) => <div><h1>{title}</h1>{children}</div>,
}));
vi.mock("@/componenets/admin/examContent/ContentLibrary", () => ({ PreviewDialog: () => null }));

const row = (over: Record<string, unknown> = {}) => ({
    id: "e1", title: "Mittagsbetreuung an der Grundschule", section: "LESEVERSTEHEN", taskType: "TEXT_TRUE_FALSE", level: "B1", partNumber: 4, published: false,
    questionCount: 3, examType: "DTZ", status: "DRAFT", externalId: "DTZ-B1-L4-001", version: 1, difficulty: "A2_B1", updatedAt: null,
    topic: "Schule und Kinderbetreuung", sourceType: "INFORMATION_SHEET", createdAt: "2026-10-13T08:00:00", passageCount: 1, wordCount: 231, ...over,
});

function renderManager() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={client}>
            <DtzDirectoryManager variant="trueFalse" />
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    list.mockReset();
    changeStatus.mockReset();
    list.mockResolvedValue({ data: [row()] });
    changeStatus.mockResolvedValue({ data: { failures: [] } });
});
afterEach(cleanup);

describe("DTZ Lesen Teil 4 admin list", () => {
    it("lists the Teil 4 exercises with title, topic, difficulty, text length, question count, status and creation date", async () => {
        renderManager();
        expect(await screen.findByText("Mittagsbetreuung an der Grundschule")).toBeTruthy();
        expect(list).toHaveBeenCalledWith(expect.objectContaining({ examType: "DTZ", section: "LESEVERSTEHEN", partNumber: "4" }));
        for (const header of ["Title", "Topic", "Difficulty", "Text length", "Questions", "Status", "Created"]) {
            expect(screen.getByRole("columnheader", { name: header })).toBeTruthy();
        }
        expect(screen.getByText("Schule und Kinderbetreuung")).toBeTruthy();
        expect(screen.getByText("231 words")).toBeTruthy();
        expect(screen.getByText("A2–B1")).toBeTruthy();
        expect(screen.getByText("3")).toBeTruthy();
        expect(screen.getByText("13.10.2026")).toBeTruthy();
        expect(within(screen.getAllByRole("row")[1]).getByText(/Draft/i)).toBeTruthy();
    });

    it("offers the creator entry points: generate, import and create manually", async () => {
        renderManager();
        await screen.findByText("Mittagsbetreuung an der Grundschule");
        expect(screen.getByRole("link", { name: /Generate with external AI/ }).getAttribute("href")).toBe("/admin/exam-prep/content-generator?exam=DTZ&section=LESEN&part=TEIL_4");
        expect(screen.getByRole("link", { name: /Import JSON/ }).getAttribute("href")).toBe("/admin/exam-prep/import");
        expect(screen.getByRole("link", { name: /Create manually/ }).getAttribute("href")).toBe("/admin/exam-prep/leseverstehen?new=dtz-true-false");
        expect(screen.getByRole("link", { name: /Edit/ }).getAttribute("href")).toBe("/admin/exam-prep/leseverstehen?edit=e1");
    });

    it("publishes a draft through approval and archives it", async () => {
        renderManager();
        await screen.findByText("Mittagsbetreuung an der Grundschule");
        fireEvent.click(screen.getByRole("button", { name: /Publish/ }));
        await waitFor(() => expect(changeStatus).toHaveBeenCalledTimes(2));
        expect(changeStatus.mock.calls.map((c) => c[1])).toEqual(["APPROVED", "PUBLISHED"]);
        changeStatus.mockClear();
        fireEvent.click(screen.getByRole("button", { name: /Archive/ }));
        await waitFor(() => expect(changeStatus).toHaveBeenCalledWith(["e1"], "ARCHIVED"));
    });
});
