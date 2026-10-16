// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DtzOralPromptPanel from "./DtzOralPromptPanel";
import DtzOralImportPanel from "./DtzOralImportPanel";

const generate = vi.fn();
const validate = vi.fn();
const doImport = vi.fn();
const copy = vi.fn();
vi.mock("@/services/adminExamContentService", () => ({
    generateExamContentPrompt: (req: unknown) => generate(req),
    validateExamContent: (json: string) => validate(json),
    importExamContent: (json: string, selected: number[]) => doImport(json, selected),
}));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/componenets/admin/examContent/shared", async () => {
    const actual = await vi.importActual<Record<string, unknown>>("@/componenets/admin/examContent/shared");
    return { ...actual, copyText: (text: string) => copy(text), ExerciseView: () => <div>Exercise preview</div> };
});

beforeEach(() => {
    generate.mockReset();
    validate.mockReset();
    doImport.mockReset();
    copy.mockReset();
    copy.mockResolvedValue(true);
    generate.mockResolvedValue({ data: { prompt: "PROMPT TEXT", promptVersion: "1.0", schemaVersion: "1.0", jsonExample: "{}", existingCount: 0, firstExternalId: "x" } });
});
afterEach(cleanup);

describe("AI content generation prompt per part", () => {
    it("asks for the prompt of the part it belongs to", async () => {
        for (const part of [1, 2, 3] as const) {
            generate.mockClear();
            const { unmount } = render(<DtzOralPromptPanel part={part} />);
            fireEvent.click(screen.getByRole("button", { name: /Generate prompt/ }));
            await waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
            expect(generate).toHaveBeenCalledWith(expect.objectContaining({ exam: "DTZ", section: "MUENDLICH", part: `TEIL_${part}` }));
            unmount();
        }
    });

    it("offers the suggested categories and custom topics for Teil 2 and sends the selection", async () => {
        render(<DtzOralPromptPanel part={2} />);
        fireEvent.click(screen.getByRole("button", { name: "Einkaufen" }));
        fireEvent.change(screen.getByLabelText("Custom topic"), { target: { value: "Haustiere" } });
        fireEvent.click(screen.getByRole("button", { name: "Add" }));
        fireEvent.click(screen.getByRole("button", { name: /Generate prompt/ }));
        await waitFor(() => expect(generate).toHaveBeenCalled());
        expect(generate.mock.calls[0][0].topics).toEqual(["Einkaufen", "Haustiere"]);
        expect(screen.getByRole("button", { name: "Alltag und Dienstleistungen" })).toBeTruthy();
    });

    it("offers the planning scenarios for Teil 3 and no settings for the fixed Teil 1", () => {
        const { unmount } = render(<DtzOralPromptPanel part={3} />);
        expect(screen.getByRole("button", { name: "Einen Ausflug planen" })).toBeTruthy();
        unmount();
        render(<DtzOralPromptPanel part={1} />);
        expect(screen.queryByLabelText("Custom topic")).toBeNull();
        expect(screen.getByText(/fixed template/)).toBeTruthy();
    });

    it("copies the generated prompt", async () => {
        render(<DtzOralPromptPanel part={2} />);
        fireEvent.click(screen.getByRole("button", { name: /Generate prompt/ }));
        await screen.findByDisplayValue("PROMPT TEXT");
        fireEvent.click(screen.getByRole("button", { name: /Copy Prompt/ }));
        await waitFor(() => expect(copy).toHaveBeenCalledWith("PROMPT TEXT"));
        expect(await screen.findByText("Copied")).toBeTruthy();
    });
});

const report = (over: Record<string, unknown> = {}) => ({
    data: {
        syntaxValid: true, valid: true, part: "2", checks: [{ label: "A2 and B1 questions", ok: true }], issues: [],
        exercises: [{ index: 0, title: "Einkaufen", state: "OK", importable: true, issues: [{ severity: "WARNING", code: "IMAGE_PENDING", path: "image.imageUrl", message: "No image attached yet." }], preview: { title: "Einkaufen", headings: [], texts: [] } }],
        ...over,
    },
});

describe("JSON upload, validation and import", () => {
    it("rejects text that is not JSON before calling the server", async () => {
        render(<DtzOralImportPanel part={2} onImported={vi.fn()} />);
        fireEvent.change(screen.getByLabelText("JSON content"), { target: { value: "Here is your exercise: {}" } });
        fireEvent.click(screen.getByRole("button", { name: "Validate" }));
        expect((await screen.findByRole("alert")).textContent).toMatch(/must start with '\{'/);
        expect(validate).not.toHaveBeenCalled();
    });

    it("validates an uploaded file, shows checks, warnings and the preview, and imports it as a draft", async () => {
        validate.mockResolvedValue(report());
        doImport.mockResolvedValue({ data: { imported: [{ index: 0, id: "n1", externalId: null, title: "Einkaufen" }], skipped: [] } });
        const onImported = vi.fn();
        render(<DtzOralImportPanel part={2} onImported={onImported} />);
        const file = new File(['{"exam":"DTZ"}'], "teil2.json", { type: "application/json" });
        Object.defineProperty(file, "text", { value: () => Promise.resolve('{"exam":"DTZ"}') });
        fireEvent.change(screen.getByLabelText("JSON file"), { target: { files: [file] } });
        await screen.findByDisplayValue('{"exam":"DTZ"}');
        fireEvent.click(screen.getByRole("button", { name: "Validate" }));

        expect(await screen.findByText("A2 and B1 questions")).toBeTruthy();
        expect(screen.getByText(/No image attached yet/)).toBeTruthy();
        expect(screen.getByText("Exercise preview")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Import as DRAFT/ }));
        await waitFor(() => expect(doImport).toHaveBeenCalledWith('{"exam":"DTZ"}', [0]));
        await waitFor(() => expect(onImported).toHaveBeenCalled());
        expect(screen.getByRole("status").textContent).toMatch(/1 imported as draft/);
    });

    it("refuses to import a file that belongs to another part", async () => {
        validate.mockResolvedValue(report({ part: "TEIL_3" }));
        render(<DtzOralImportPanel part={2} onImported={vi.fn()} />);
        fireEvent.change(screen.getByLabelText("JSON content"), { target: { value: '{"exam":"DTZ"}' } });
        fireEvent.click(screen.getByRole("button", { name: "Validate" }));
        expect((await screen.findByText(/This file is for Teil 3, not Teil 2/))).toBeTruthy();
        expect((screen.getByRole("button", { name: /Import as DRAFT/ }) as HTMLButtonElement).disabled).toBe(true);
    });

    it("cannot import invalid content", async () => {
        validate.mockResolvedValue(report({ valid: false, exercises: [{ index: 0, title: "x", state: "INVALID", importable: false, issues: [{ severity: "ERROR", code: "NOTES_COUNT", path: "planningNotes", message: "Between 4 and 6 planning notes are required." }], preview: null }] }));
        render(<DtzOralImportPanel part={2} onImported={vi.fn()} />);
        fireEvent.change(screen.getByLabelText("JSON content"), { target: { value: '{"exam":"DTZ"}' } });
        fireEvent.click(screen.getByRole("button", { name: "Validate" }));
        expect(await screen.findByText(/Between 4 and 6 planning notes/)).toBeTruthy();
        expect((screen.getByRole("button", { name: /Import as DRAFT/ }) as HTMLButtonElement).disabled).toBe(true);
    });
});
