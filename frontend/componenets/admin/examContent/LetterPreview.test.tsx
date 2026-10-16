// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ExerciseView } from "./shared";
import { ExercisePreviewData } from "@/types/examContent";

const options = (n: number) => ["a", "b", "c"].map((id) => ({ id, text: `Option ${id}${n}` }));

const preview: ExercisePreviewData = {
    title: "Eine Beschwerde an ein Hotel",
    instructions: "Lesen Sie den Text und schließen Sie die Lücken 40–45.",
    headings: [],
    texts: [],
    readingText: "Wir haben [40] Hotel ausgesucht, [41] ...",
    questions: [40, 41, 42, 43, 44, 45].map((n) => ({
        id: `question_${n}`, number: n, question: `Lücke ${n}`, options: options(n), correctOptionId: n % 2 ? "a" : "b", questionType: "PRAEPOSITION",
    })),
    letter: {
        type: "COMPLAINT",
        topic: "Reisen und Unterkunft",
        languageLevel: "A2_B1",
        sender: null,
        recipient: "Hotel Zum Löwen",
        date: "23.05.20XX",
        subject: "Beschwerde",
        body: "Sehr geehrte Damen und Herren,\n\nwir haben {{40}} Hotel ausgesucht, {{41}} das Zimmer war laut {{42}} {{43}} {{44}} {{45}}.",
        example: {
            textBeforeGap: "Sehr ",
            textAfterGap: " Damen und Herren,",
            options: [{ id: "a", text: "geehrte" }, { id: "b", text: "geehrten" }, { id: "c", text: "geehrter" }],
            correctOptionId: "a",
            explanation: { de: "Beispiel DE" },
        },
        gaps: [40, 41, 42, 43, 44, 45].map((n) => ({
            number: n, grammarCategory: "POSSESSIVARTIKEL", grammarFocus: `Focus ${n}`, explanation: { de: `DE ${n}`, en: `EN ${n}`, fa: `FA ${n}` },
        })),
    },
};

afterEach(cleanup);

describe("DTZ Lesen Teil 5 preview", () => {
    it("shows the letter as a document with visible blanks 40–45, the options below and no answer key", () => {
        const { container } = render(<ExerciseView preview={preview} />);
        expect(screen.getByText(/Hotel Zum Löwen/)).toBeTruthy();
        expect(screen.getByText(/Betreff: Beschwerde/)).toBeTruthy();
        expect(screen.getByText("Complaint")).toBeTruthy();
        const blanks = Array.from(container.querySelectorAll("section[aria-label='Letter'] .exam-gap-marker")).map((e) => e.textContent);
        expect(blanks).toEqual(["40", "41", "42", "43", "44", "45"]);
        expect(screen.queryByText(/\{\{40}}/)).toBeNull();
        for (const n of [40, 45]) {
            expect(screen.getByText(`Option a${n}`)).toBeTruthy();
            expect(screen.getByText(`Option c${n}`)).toBeTruthy();
        }
        expect(screen.queryByText("DE 40")).toBeNull();
        expect(screen.queryByText(/Correct:/)).toBeNull();
    });

    it("shows the example gap as an unscored demonstration", () => {
        const { container } = render(<ExerciseView preview={preview} />);
        expect(screen.getByText(/Beispiel \(0\)/)).toBeTruthy();
        expect(container.querySelector("section[aria-label='Example'] .exam-gap-marker")?.textContent).toBe("0");
        expect(screen.getByText("geehrte")).toBeTruthy();
        // the example is not one of the six numbered questions
        expect(screen.getAllByRole("heading", { level: 4 }).map((h) => h.textContent).filter((t) => /^\d+$/.test(t ?? ""))).toEqual(["40", "41", "42", "43", "44", "45"]);
    });

    it("shows correct option, grammar category, focus and the de / en / fa explanations in the admin answer-key view", () => {
        render(<ExerciseView preview={preview} />);
        fireEvent.click(screen.getByLabelText(/Show answer key/));
        expect(screen.getAllByText(/Correct:/)).toHaveLength(6);
        expect(screen.getAllByText("possessivartikel")).toHaveLength(6);
        expect(screen.getByText("Focus 41")).toBeTruthy();
        expect(screen.getByText("DE 40")).toBeTruthy();
        expect(screen.getByText("EN 43")).toBeTruthy();
        expect(screen.getByText("FA 45")).toBeTruthy();
        fireEvent.click(screen.getByLabelText(/Show answer key/));
        expect(screen.queryByText("DE 40")).toBeNull();
    });

    it("works without an example", () => {
        render(<ExerciseView preview={{ ...preview, letter: { ...preview.letter!, example: null } }} />);
        expect(screen.queryByText(/Beispiel \(0\)/)).toBeNull();
    });

});
