// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DtzOralEditor from "./DtzOralEditor";

const create = vi.fn();
const update = vi.fn();
const validate = vi.fn();
const getOne = vi.fn();
const upload = vi.fn();
vi.mock("@/services/adminExamContentService", () => ({
    createDtzOral: (body: unknown) => create(body),
    updateDtzOral: (id: string, body: unknown) => update(id, body),
    validateExamContent: (json: string) => validate(json),
}));
vi.mock("@/services/adminExamService", () => ({
    getExamExerciseForAdmin: (id: string) => getOne(id),
    uploadExamPassageImage: (file: File) => upload(file),
}));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/backendOrigin", async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    resolveUploadUrl: (url: string | null) => (url ? `http://backend${url}` : null),
}));

const storedTeil2 = {
    data: {
        title: "Einkaufen im Internet",
        metadata: {
            dtzOral: {
                part: 2, languageLevel: "A2_B1", topic: "Einkaufen",
                image: { imageUrl: null, imagePrompt: "An original photograph of a woman shopping online, no readable text, no logos.", altText: "Eine Frau am Laptop." },
                participantA: { questions: [] },
                participantB: { questionsA2: ["a1?", "a2?", "a3?", "a4?"], questionsB1: ["b1?", "b2?", "b3?", "b4?"] },
                possibleSolution: { description: "Ich sehe eine Frau.", experienceA2: "Ich kaufe online.", experienceB1: null },
            },
        },
    },
};
const storedTeil3 = {
    data: {
        title: "Ein Klassenfest organisieren",
        metadata: { dtzOral: { part: 3, topic: "Klassenfest", situation: "Sie beide organisieren ein Fest.", planningNotes: [{ number: 1, label: "Wann?" }, { number: 2, label: "Wo?" }, { number: 3, label: "Essen?" }, { number: 4, label: "Musik?" }] } },
    },
};

beforeEach(() => {
    [create, update, validate, getOne, upload].forEach((m) => m.mockReset());
    create.mockResolvedValue({ data: { id: "n1", warnings: [] } });
    update.mockResolvedValue({ data: { id: "e1", warnings: [] } });
    validate.mockResolvedValue({ data: { syntaxValid: true, valid: true, checks: [{ label: "Valid", ok: true }], issues: [], exercises: [{ index: 0, issues: [{ severity: "WARNING", code: "IMAGE_PENDING", path: "x", message: "No image is attached yet." }] }] } });
});
afterEach(cleanup);

describe("Teil 1 editor", () => {
    it("shows the six fixed topics in order and saves the template without letting them change", async () => {
        render(<DtzOralEditor part={1} onClose={vi.fn()} onSaved={vi.fn()} />);
        const topics = within(screen.getByRole("list", { name: "Fixed topics" })).getAllByRole("listitem").map((li) => li.textContent);
        expect(topics).toEqual(["1Name", "2Geburtsort", "3Wohnort", "4Arbeit/Beruf", "5Familie", "6Sprachen"]);
        expect(screen.queryByLabelText(/topic label/i)).toBeNull();

        fireEvent.change(screen.getByLabelText("Short guidance for learners (optional)"), { target: { value: "Ein bis zwei Sätze pro Thema." } });
        fireEvent.change(screen.getByLabelText("Name · simple question"), { target: { value: "Wie heißen Sie?" } });
        fireEvent.click(screen.getByRole("button", { name: "Save as Draft" }));
        await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
        const body = create.mock.calls[0][0];
        expect(body.part).toBe(1);
        expect(body.topics.map((t: { label: string }) => t.label)).toEqual(["Name", "Geburtsort", "Wohnort", "Arbeit/Beruf", "Familie", "Sprachen"]);
        expect(body.guidance).toBe("Ein bis zwei Sätze pro Thema.");
        expect(body.practiceSupport).toEqual([{ topicNumber: 1, question: "Wie heißen Sie?", sentenceStarter: null, vocabulary: [] }]);
    });
});

describe("Teil 2 editor", () => {
    it("requires a topic and all eight questions (but no image) before saving", async () => {
        render(<DtzOralEditor part={2} onClose={vi.fn()} onSaved={vi.fn()} />);
        fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Reisen" } });
        fireEvent.click(screen.getByRole("button", { name: "Save as Draft" }));
        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toMatch(/topic must not be empty/);
        expect(alert.textContent).not.toMatch(/image/);
        expect(alert.textContent).toMatch(/4 A2 questions/);
        expect(alert.textContent).toMatch(/4 B1 questions/);
        expect(create).not.toHaveBeenCalled();
    });

    it("uploads a photo, previews it and saves it with the exercise", async () => {
        getOne.mockResolvedValue(storedTeil2);
        upload.mockResolvedValue({ data: { url: "/uploads/exam-passages/abc.webp" } });
        const onSaved = vi.fn();
        render(<DtzOralEditor part={2} exerciseId="e1" onClose={vi.fn()} onSaved={onSaved} />);
        await screen.findByDisplayValue("Einkaufen im Internet");
        expect(screen.getByText("Cannot be published without an image")).toBeTruthy();

        const file = new File(["x"], "foto.webp", { type: "image/webp" });
        fireEvent.change(screen.getByLabelText("Photo file"), { target: { files: [file] } });
        await waitFor(() => expect(upload).toHaveBeenCalledWith(file));
        const img = (await screen.findByAltText("Eine Frau am Laptop.")) as HTMLImageElement;
        expect(img.src).toBe("http://backend/uploads/exam-passages/abc.webp");
        expect(screen.getByText("Image attached")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
        const [id, body] = update.mock.calls[0];
        expect(id).toBe("e1");
        expect(body.image.imageUrl).toBe("/uploads/exam-passages/abc.webp");
        expect(body.possibleSolution).toEqual({ description: "Ich sehe eine Frau.", experienceA2: "Ich kaufe online.", experienceB1: null });
        expect(body.participantB.questionsA2).toHaveLength(4);
        expect(body.participantB.questionsB1).toHaveLength(4);
        expect(body.participantA.questions).toEqual(["Was sehen Sie auf dem Foto?", "Was für eine Situation zeigt dieses Bild?"]);
        expect(onSaved).toHaveBeenCalledWith("e1");
    });

    it("edits the possible solution", async () => {
        getOne.mockResolvedValue(storedTeil2);
        render(<DtzOralEditor part={2} exerciseId="e1" onClose={vi.fn()} onSaved={vi.fn()} />);
        await screen.findByDisplayValue("Einkaufen im Internet");
        fireEvent.change(screen.getByLabelText("Possible solution · experiences B1 (B)"), { target: { value: "Ich kaufe online, weil es bequem ist." } });
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        await waitFor(() => expect(update).toHaveBeenCalled());
        expect(update.mock.calls[0][1].possibleSolution.experienceB1).toBe("Ich kaufe online, weil es bequem ist.");
    });

    it("rejects a file that is not an image", async () => {
        render(<DtzOralEditor part={2} onClose={vi.fn()} onSaved={vi.fn()} />);
        fireEvent.change(screen.getByLabelText("Photo file"), { target: { files: [new File(["x"], "doc.pdf", { type: "application/pdf" })] } });
        expect((await screen.findByText(/Only JPEG, PNG or WebP/))).toBeTruthy();
        expect(upload).not.toHaveBeenCalled();
    });

    it("validates the current content and shows the status, the JSON and the learner preview", async () => {
        getOne.mockResolvedValue(storedTeil2);
        render(<DtzOralEditor part={2} exerciseId="e1" onClose={vi.fn()} onSaved={vi.fn()} />);
        await screen.findByDisplayValue("Einkaufen im Internet");
        fireEvent.click(screen.getByRole("button", { name: "Validate" }));
        expect(await screen.findByText(/Valid — ready to save/)).toBeTruthy();
        expect(screen.getByText(/No image is attached yet/)).toBeTruthy();
        const sent = JSON.parse(validate.mock.calls[0][0]);
        expect(sent).toMatchObject({ exam: "DTZ", section: "MUENDLICH", exerciseType: "PHOTO_EXPERIENCE", part: 2, topic: "Einkaufen" });

        fireEvent.click(screen.getByRole("button", { name: "Preview" }));
        expect(await screen.findByRole("region", { name: "Teilnehmer A" })).toBeTruthy();
        expect(screen.getByText("a1?")).toBeTruthy();
        expect(screen.getByText(/Image prompt \(admin only\)/)).toBeTruthy();
    });
});

describe("Teil 3 editor", () => {
    it("edits, adds and removes planning notes within four to six", async () => {
        getOne.mockResolvedValue(storedTeil3);
        render(<DtzOralEditor part={3} exerciseId="e1" onClose={vi.fn()} onSaved={vi.fn()} />);
        await screen.findByDisplayValue("Ein Klassenfest organisieren");
        expect(screen.getAllByLabelText(/Planning note \d/)).toHaveLength(4);
        expect((screen.getByLabelText("Remove note 1") as HTMLButtonElement).disabled).toBe(true);

        fireEvent.change(screen.getByLabelText("Planning note 2"), { target: { value: "Wo feiern?" } });
        fireEvent.click(screen.getByRole("button", { name: /Add note/ }));
        fireEvent.change(screen.getByLabelText("Planning note 5"), { target: { value: "Wer bringt was mit?" } });
        fireEvent.click(screen.getByRole("button", { name: /Add note/ }));
        expect((screen.getByRole("button", { name: /Add note/ }) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(screen.getByLabelText("Remove note 6"));
        expect(screen.getAllByLabelText(/Planning note \d/)).toHaveLength(5);

        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
        const body = update.mock.calls[0][1];
        expect(body.taskInstruction).toBe("Planen Sie gemeinsam, was Sie tun wollen.");
        expect(body.planningNotes).toEqual([
            { number: 1, label: "Wann?" }, { number: 2, label: "Wo feiern?" }, { number: 3, label: "Essen?" }, { number: 4, label: "Musik?" }, { number: 5, label: "Wer bringt was mit?" },
        ]);
    });

    it("does not save an empty or repeated note", async () => {
        getOne.mockResolvedValue(storedTeil3);
        render(<DtzOralEditor part={3} exerciseId="e1" onClose={vi.fn()} onSaved={vi.fn()} />);
        await screen.findByDisplayValue("Ein Klassenfest organisieren");
        fireEvent.change(screen.getByLabelText("Planning note 2"), { target: { value: "wann?" } });
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        expect((await screen.findByRole("alert")).textContent).toMatch(/must not repeat/);
        fireEvent.change(screen.getByLabelText("Planning note 2"), { target: { value: " " } });
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/No planning note may be empty/));
        expect(update).not.toHaveBeenCalled();
    });

    it("shows the backend's refusal", async () => {
        getOne.mockResolvedValue(storedTeil3);
        update.mockRejectedValue({ response: { data: { message: "planningNotes: Between 4 and 6 planning notes are required." } } });
        render(<DtzOralEditor part={3} exerciseId="e1" onClose={vi.fn()} onSaved={vi.fn()} />);
        await screen.findByDisplayValue("Ein Klassenfest organisieren");
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
        await waitFor(() => expect(screen.getByRole("alert").textContent).toBeTruthy());
    });
});
