// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ExamExerciseBrowser from "./ExamExerciseBrowser";
import { ExamTypeCode } from "@/types/exam";

const list = vi.fn();
const changeStatus = vi.fn();
const remove = vi.fn();
vi.mock("@/services/adminExamService", () => ({ getExamExercisesForAdmin: (params: unknown) => list(params), deleteExamExercise: (id: string) => remove(id) }));
vi.mock("@/services/adminExamContentService", () => ({ changeExamContentStatus: (ids: string[], status: string) => changeStatus(ids, status) }));
vi.mock("@/store/useAuthStore", () => ({ default: () => ({ userProfile: { role: "ADMIN" }, hasHydrated: true }) }));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/componenets/admin/examContent/ContentLibrary", () => ({ PreviewDialog: ({ row }: { row: { title: string } }) => <div role="dialog">Preview {row.title}</div> }));

const row = (over: Record<string, unknown> = {}) => ({
    id: "e1", title: "Anzeigen lesen", section: "LESEVERSTEHEN", taskType: "SITUATION_MATCHING", level: "B1", partNumber: 2, published: false,
    questionCount: 5, examType: "TELC", status: "DRAFT", externalId: null, version: 1, difficulty: null, updatedAt: null, ...over,
});

function renderBrowser(examType: ExamTypeCode, props: Partial<React.ComponentProps<typeof ExamExerciseBrowser>> = {}) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={client}>
            <ExamExerciseBrowser section="LESEVERSTEHEN" examType={examType} teilNumbers={[1, 2, 3]} taskTypes={["MATCHING", "MULTIPLE_CHOICE"]} {...props} />
        </QueryClientProvider>,
    );
}
const search = () => fireEvent.click(screen.getByRole("button", { name: /Search/ }));

beforeEach(() => {
    list.mockReset();
    changeStatus.mockReset();
    remove.mockReset();
    list.mockResolvedValue({ data: [row()] });
    changeStatus.mockResolvedValue({ data: { failures: [] } });
    remove.mockResolvedValue({});
});
afterEach(cleanup);

describe("ExamExerciseBrowser", () => {
    it("loads nothing until Search, for Telc and DTZ alike, and sends the exam, section and filters", async () => {
        for (const exam of ["TELC", "DTZ"] as const) {
            list.mockClear();
            renderBrowser(exam);
            expect(list).not.toHaveBeenCalled();
            fireEvent.change(screen.getByLabelText("Teil"), { target: { value: "2" } });
            fireEvent.change(screen.getByLabelText("Status"), { target: { value: "DRAFT" } });
            fireEvent.change(screen.getByLabelText("Title"), { target: { value: " Anzeigen " } });
            search();
            await screen.findByText("Anzeigen lesen");
            expect(list).toHaveBeenCalledWith({ section: "LESEVERSTEHEN", examType: exam, partNumber: "2", status: "DRAFT", search: "Anzeigen", level: undefined, taskType: undefined });
            cleanup();
        }
    });

    it("offers the level filter for Telc only; DTZ is always A2–B1", () => {
        renderBrowser("TELC");
        expect(screen.getByLabelText("Level")).toBeTruthy();
        cleanup();
        renderBrowser("DTZ");
        expect(screen.queryByLabelText("Level")).toBeNull();
    });

    it("shows the same columns for both exams", async () => {
        renderBrowser("DTZ");
        search();
        await screen.findByText("Anzeigen lesen");
        for (const header of ["Title", "Teil", "Task type", "Level", "Questions", "Status", "Actions"]) {
            expect(screen.getByRole("columnheader", { name: new RegExp(`^${header}`) })).toBeTruthy();
        }
        const cells = within(screen.getAllByRole("row")[1]);
        expect(cells.getByText("Teil 2")).toBeTruthy();
        expect(cells.getByText(/Draft/)).toBeTruthy();
    });

    it("previews, edits, publishes through approval, archives and deletes", async () => {
        const onEdit = vi.fn();
        renderBrowser("TELC", { onEdit, deletable: true });
        search();
        await screen.findByText("Anzeigen lesen");
        fireEvent.click(screen.getByRole("button", { name: "Preview" }));
        expect(screen.getByText("Preview Anzeigen lesen")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Edit" }));
        expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "e1" }));
        fireEvent.click(screen.getByRole("button", { name: "Publish" }));
        await waitFor(() => expect(changeStatus).toHaveBeenCalledTimes(2));
        expect(changeStatus.mock.calls.map((c) => c[1])).toEqual(["APPROVED", "PUBLISHED"]);
        changeStatus.mockClear();
        fireEvent.click(screen.getByRole("button", { name: "Archive" }));
        await waitFor(() => expect(changeStatus).toHaveBeenCalledWith(["e1"], "ARCHIVED"));
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        const [, confirm] = await screen.findAllByRole("button", { name: "Delete" });
        fireEvent.click(confirm);
        await waitFor(() => expect(remove).toHaveBeenCalledWith("e1"));
    });

    it("has no Edit button without an editor and no Delete button unless deletable; published rows can be unpublished", async () => {
        list.mockResolvedValue({ data: [row({ status: "PUBLISHED", published: true })] });
        renderBrowser("TELC");
        search();
        await screen.findByText("Anzeigen lesen");
        expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
        expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Unpublish" }));
        await waitFor(() => expect(changeStatus).toHaveBeenCalledWith(["e1"], "DRAFT"));
    });
});
