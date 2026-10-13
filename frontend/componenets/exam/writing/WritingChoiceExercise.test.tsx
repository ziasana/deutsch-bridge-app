// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WritingChoiceExercise from "./WritingChoiceExercise";
import { ExamExercisePublicResponse } from "@/types/exam";

const getAttempts = vi.fn();
const submit = vi.fn();
vi.mock("@/services/writingAttemptService", () => ({
    getWritingAttempts: (id: string) => getAttempts(id),
    submitWritingAttempt: (request: unknown) => submit(request),
    requestWritingAiFeedback: vi.fn(),
}));
vi.mock("@/services/writingService", () => ({ getWritingLearning: vi.fn() }));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const task = (label: "A" | "B", type: string) => ({
    taskLabel: label,
    title: `Titel ${label}`,
    topic: null,
    communicationType: type,
    situation: `Situation ${label}`,
    recipient: { name: `Empfänger ${label}`, role: "Rolle" },
    writingInstruction: `Anweisung ${label}`,
    points: [1, 2, 3, 4].map((n) => ({ number: n, text: `Punkt ${label}${n}` })),
});

const exercise = {
    id: "w1",
    title: "Schriftliche Kommunikation im Alltag",
    section: "SCHRIFTLICHER_AUSDRUCK",
    taskType: "WRITING_TASK_CHOICE",
    level: "B1",
    teilDescription: "Wählen Sie Aufgabe A oder Aufgabe B. Zeigen Sie, was Sie können.",
    requiresPlanning: false,
    modelSolution: null,
    writingChoice: { durationMinutes: 30, tasks: [task("A", "FORMAL_EMAIL"), task("B", "INFORMAL_EMAIL")] },
} as unknown as ExamExercisePublicResponse;

function renderExercise(onSubmitted = vi.fn()) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(
        <QueryClientProvider client={client}>
            <WritingChoiceExercise exercise={exercise} onSubmitted={onSubmitted} />
        </QueryClientProvider>,
    );
    return { ...view, onSubmitted };
}

const chooseRadio = (label: string) => screen.getByRole("radio", { name: `Aufgabe ${label} wählen`, hidden: true }) as HTMLInputElement;

beforeEach(() => {
    localStorage.clear();
    getAttempts.mockReset();
    submit.mockReset();
    getAttempts.mockResolvedValue({ data: [] });
    submit.mockImplementation((request: { selectedTask: string; text: string }) =>
        Promise.resolve({
            data: { id: "a1", exerciseId: "w1", mode: "PRACTICE", text: request.text, planNotes: [], wordCount: 3, attemptNumber: 1, parentAttemptId: null,
                    submittedAt: "2026-10-13T10:00:00", feedback: null, aiFeedback: null, selectedTask: request.selectedTask },
        }),
    );
});
afterEach(cleanup);

describe("DTZ Schreiben learner exercise", () => {
    it("shows the 30 minutes, the standard instructions and two separate alternatives, but no editor before a choice", async () => {
        renderExercise();
        expect(screen.getByText("30 Minuten")).toBeTruthy();
        expect(screen.getByText(/Zeigen Sie, was Sie können/)).toBeTruthy();
        const a = within(screen.getByRole("article", { name: "Aufgabe A" }));
        const b = within(screen.getByRole("article", { name: "Aufgabe B" }));
        expect(a.getAllByRole("listitem")).toHaveLength(4);
        expect(b.getAllByRole("listitem")).toHaveLength(4);
        expect(screen.queryByLabelText(/Deine Antwort/)).toBeNull();
        expect(screen.getByText(/Wählen Sie Aufgabe A oder Aufgabe B, um mit dem Schreiben zu beginnen/)).toBeTruthy();
        expect(screen.queryByText(/Musterlösung|mögliche Antwort/i)).toBeNull();
    });

    it("lets the learner choose A or B, only one at a time, and shows the editor for the chosen task", async () => {
        renderExercise();
        fireEvent.click(chooseRadio("A"));
        expect(chooseRadio("A").checked).toBe(true);
        expect(chooseRadio("B").checked).toBe(false);
        expect(await screen.findByLabelText(/Deine Antwort/)).toBeTruthy();
        expect(screen.getByText("Sie schreiben zu Aufgabe A: Titel A")).toBeTruthy();

        fireEvent.click(chooseRadio("B"));
        expect(chooseRadio("A").checked).toBe(false);
        expect(chooseRadio("B").checked).toBe(true);
        expect(screen.getByText("Sie schreiben zu Aufgabe B: Titel B")).toBeTruthy();
        expect(screen.getAllByRole("radio", { hidden: true }).filter((r) => (r as HTMLInputElement).checked)).toHaveLength(1);
    });

    it("keeps the chosen task and the text when the learner leaves and comes back", async () => {
        const first = renderExercise();
        fireEvent.click(chooseRadio("B"));
        const editor = (await screen.findByLabelText(/Deine Antwort/)) as HTMLTextAreaElement;
        fireEvent.change(editor, { target: { value: "Liebe Lena, ich lade dich ein." } });
        await waitFor(() => expect(localStorage.getItem("writing-draft-w1-B")).toContain("Liebe Lena"), { timeout: 2000 });
        first.unmount();

        renderExercise();
        expect(chooseRadio("B").checked).toBe(true);
        expect(((await screen.findByLabelText(/Deine Antwort/)) as HTMLTextAreaElement).value).toBe("Liebe Lena, ich lade dich ein.");
        // the other alternative has its own, empty draft
        fireEvent.click(chooseRadio("A"));
        expect(((await screen.findByLabelText(/Deine Antwort/)) as HTMLTextAreaElement).value).toBe("");
    });

    it("submits the response together with the selected task label", async () => {
        const { onSubmitted } = renderExercise();
        fireEvent.click(chooseRadio("A"));
        fireEvent.change(await screen.findByLabelText(/Deine Antwort/), { target: { value: "Sehr geehrter Herr Schmidt, ich habe Fragen." } });
        fireEvent.click(screen.getByRole("button", { name: /Abgeben/ }));
        fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Abgeben" }));

        await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
        expect(submit.mock.calls[0][0]).toMatchObject({ exerciseId: "w1", selectedTask: "A", text: "Sehr geehrter Herr Schmidt, ich habe Fragen." });
        await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
        expect(await screen.findByText(/Text abgegeben/)).toBeTruthy();
        expect(screen.getByText(/Aufgabe A · Versuch 1/)).toBeTruthy();
    });

    it("reopens on the alternative of the latest submitted text when no choice is remembered on this device", async () => {
        getAttempts.mockResolvedValue({
            data: [{ id: "a1", exerciseId: "w1", mode: "PRACTICE", text: "Mein Text zu B", planNotes: [], wordCount: 4, attemptNumber: 1, parentAttemptId: null,
                     submittedAt: "2026-10-13T10:00:00", feedback: null, aiFeedback: null, selectedTask: "B" }],
        });
        renderExercise();
        await waitFor(() => expect(chooseRadio("B").checked).toBe(true));
        expect(await screen.findByText("Mein Text zu B")).toBeTruthy();
    });
});
