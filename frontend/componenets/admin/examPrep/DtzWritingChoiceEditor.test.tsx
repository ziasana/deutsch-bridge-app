// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DtzWritingChoiceEditor from "./DtzWritingChoiceEditor";

const update = vi.fn();
const create = vi.fn();
const getOne = vi.fn();
vi.mock("@/services/adminExamContentService", () => ({
    updateWritingChoice: (id: string, body: unknown) => update(id, body),
    createWritingChoice: (body: unknown) => create(body),
}));
vi.mock("@/services/adminExamService", () => ({ getExamExerciseForAdmin: (id: string) => getOne(id) }));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const stored = {
    data: {
        title: "Alltag",
        metadata: {
            writingChoice: {
                tasks: [
                    { taskLabel: "A", title: "Kurs", topic: "Bildung", communicationType: "FORMAL_EMAIL", situation: "Sie möchten einen Kurs besuchen.", writingInstruction: "Schreiben Sie.",
                      recipient: { name: "Herr Schmidt", role: "Mitarbeiter" }, points: [1, 2, 3, 4].map((n) => ({ number: n, text: `a${n}` })) },
                    { taskLabel: "B", title: "Heizung", topic: "Wohnen", communicationType: "FORMAL_LETTER", situation: "Die Heizung ist kaputt.", writingInstruction: "Schreiben Sie einen Brief.",
                      recipient: { name: "Herr Lehmann", role: "Vermieter" }, points: [1, 2, 3, 4].map((n) => ({ number: n, text: `b${n}` })) },
                ],
            },
        },
    },
};

beforeEach(() => {
    update.mockReset();
    create.mockReset();
    getOne.mockReset();
    getOne.mockResolvedValue(stored);
    update.mockResolvedValue({ data: { id: "e1", warnings: [] } });
    create.mockResolvedValue({ data: { id: "e2", warnings: [] } });
});
afterEach(cleanup);

describe("DTZ Schreiben editor", () => {
    it("lets the administrator edit situation, recipient, instruction and all eight points, and saves them", async () => {
        const onSaved = vi.fn();
        render(<DtzWritingChoiceEditor exerciseId="e1" onClose={vi.fn()} onSaved={onSaved} />);
        await screen.findByDisplayValue("Kurs");

        fireEvent.change(screen.getByLabelText("Task A situation"), { target: { value: "Neue Situation A" } });
        fireEvent.change(screen.getByLabelText("Task A recipient name"), { target: { value: "Frau Becker" } });
        fireEvent.change(screen.getByLabelText("Task B writing instruction"), { target: { value: "Neue Anweisung B" } });
        for (const label of ["A", "B"]) {
            for (let n = 1; n <= 4; n++) {
                fireEvent.change(screen.getByLabelText(`Task ${label} point ${n}`), { target: { value: `neu ${label}${n}` } });
            }
        }
        expect(screen.getAllByLabelText(/Task [AB] point \d/)).toHaveLength(8);
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

        await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
        const [id, body] = update.mock.calls[0];
        expect(id).toBe("e1");
        expect(body.tasks[0].situation).toBe("Neue Situation A");
        expect(body.tasks[0].recipient).toEqual({ name: "Frau Becker", role: "Mitarbeiter" });
        expect(body.tasks[1].writingInstruction).toBe("Neue Anweisung B");
        expect(body.tasks.flatMap((t: { points: { text: string }[] }) => t.points.map((p) => p.text))).toEqual(
            ["neu A1", "neu A2", "neu A3", "neu A4", "neu B1", "neu B2", "neu B3", "neu B4"],
        );
        await waitFor(() => expect(onSaved).toHaveBeenCalledWith("e1"));
    });

    it("does not save while a content point is empty", async () => {
        render(<DtzWritingChoiceEditor exerciseId="e1" onClose={vi.fn()} onSaved={vi.fn()} />);
        await screen.findByDisplayValue("Kurs");
        fireEvent.change(screen.getByLabelText("Task B point 4"), { target: { value: "" } });
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        expect((await screen.findByRole("alert")).textContent).toContain("content point 4 is empty");
        expect(update).not.toHaveBeenCalled();
    });

    it("creates a draft by hand with two empty tasks", async () => {
        render(<DtzWritingChoiceEditor onClose={vi.fn()} onSaved={vi.fn()} />);
        expect(screen.getByRole("button", { name: "Create draft" })).toBeTruthy();
        expect(screen.getAllByLabelText(/Task [AB] point \d/)).toHaveLength(8);
        fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
        expect((await screen.findByRole("alert")).textContent).toBe("Enter a title.");
        expect(create).not.toHaveBeenCalled();
    });

    it("shows the server's message when the backend refuses the save", async () => {
        update.mockRejectedValue({ response: { data: { message: "Aufgabe A needs exactly four content points." } } });
        render(<DtzWritingChoiceEditor exerciseId="e1" onClose={vi.fn()} onSaved={vi.fn()} />);
        await screen.findByDisplayValue("Kurs");
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        expect((await screen.findByRole("alert")).textContent).toBe("Aufgabe A needs exactly four content points.");
    });
});
