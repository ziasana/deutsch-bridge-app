// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LesenTeil3Board, { NO_AD_ANSWER } from "./LesenTeil3Board";
import { ExerciseView } from "@/componenets/admin/examContent/shared";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";
import { ExercisePreviewData } from "@/types/examContent";

vi.mock("@/componenets/LessonMarkdown", () => ({
    default: ({ content }: { content: string }) => <div>{content.replace(/<[^>]+>/g, "")}</div>,
}));
vi.mock("@/lib/backendOrigin", () => ({ resolveUploadUrl: (u: string | null) => u }));

/** DTZ Lesen Teil 2: five situations (26-30), eight advertisements (a-h), X when no advertisement fits. */
const passages = "abcdefgh".split("").map((l) => ({
    id: `p-${l}`,
    label: l,
    content: `<p><strong>Anzeige ${l}</strong></p>`,
    imageUrl: null,
    audioUrl: null,
})) as unknown as ExamPassagePublic[];
const questions = Array.from({ length: 5 }, (_, i) => ({
    id: `q${26 + i}`,
    taskType: "SITUATION_MATCHING",
    prompt: `Situation Text ${26 + i}`,
    sectionIndex: null,
    options: null,
    gapNumber: null,
    questionNumber: 26 + i,
})) as unknown as ExamQuestionPublic[];

function Harness({ onChange }: Readonly<{ onChange?: (a: Record<string, string>) => void }>) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    return (
        <LesenTeil3Board
            passages={passages}
            questions={questions}
            answers={answers}
            disabled={false}
            onAnswer={(id, value) =>
                setAnswers((prev) => {
                    const next = { ...prev };
                    if (value) next[id] = value;
                    else delete next[id];
                    onChange?.(next);
                    return next;
                })
            }
        />
    );
}

afterEach(cleanup);

describe("DTZ Lesen Teil 2 learner board", () => {
    it("shows five situations 26-30, eight advertisements and the X choice", () => {
        render(<Harness />);
        expect(screen.getAllByRole("article")).toHaveLength(8);
        const nav = screen.getByRole("navigation", { name: "Situationen" });
        expect(nav.querySelectorAll("button")).toHaveLength(5);
        expect(nav.textContent).toContain("26");
        expect(nav.textContent).toContain("30");
        expect(screen.getByRole("button", { name: "x: keine passende Anzeige" }).textContent).toBe("X");
        for (const letter of "abcdefgh") {
            expect(screen.getByRole("button", { name: `Anzeige ${letter} für Situation 26 wählen` })).toBeTruthy();
        }
        expect(screen.queryByRole("button", { name: /Anzeige i /})).toBeNull();
    });

    it("lets the learner choose a-h or X for every situation and keeps the answers while navigating", () => {
        let latest: Record<string, string> = {};
        render(<Harness onChange={(a) => (latest = a)} />);
        fireEvent.click(screen.getByRole("button", { name: "Anzeige b für Situation 26 wählen" }));
        fireEvent.click(screen.getByRole("button", { name: "Anzeige g für Situation 27 wählen" }));
        fireEvent.click(screen.getByRole("button", { name: "x: keine passende Anzeige" }));
        expect(latest).toEqual({ q26: "p-b", q27: "p-g", q28: NO_AD_ANSWER });

        // Jump back and forth: nothing is lost.
        fireEvent.click(screen.getByRole("button", { name: /^Situation 26, Antwort Anzeige b/ }));
        fireEvent.click(screen.getByRole("button", { name: /^Situation 30/ }));
        fireEvent.click(screen.getByRole("button", { name: /^Situation 28, Antwort keine Anzeige/ }));
        expect(latest).toEqual({ q26: "p-b", q27: "p-g", q28: NO_AD_ANSWER });
        expect(screen.getByText(/3 \/5 zugeordnet|3\/5 zugeordnet/)).toBeTruthy();
    });

    it("uses every advertisement once", () => {
        let latest: Record<string, string> = {};
        render(<Harness onChange={(a) => (latest = a)} />);
        fireEvent.click(screen.getByRole("button", { name: "Anzeige d für Situation 26 wählen" }));
        fireEvent.click(screen.getByRole("button", { name: "Anzeige d für Situation 27 wählen" }));
        expect(latest).toEqual({ q27: "p-d" });
    });
});

describe("DTZ Lesen Teil 2 admin preview", () => {
    const preview: ExercisePreviewData = {
        title: "Arbeit und Weiterbildung",
        instructions: "Lesen Sie die Situationen 26–30 und die Anzeigen a–h.",
        headings: [],
        texts: [],
        situations: [
            { id: "situation_26", number: 26, text: "Sie suchen einen Job am Wochenende.", correctAdvertisementId: "b", explanation: { de: "Anzeige b sucht Hilfe am Wochenende." } },
            { id: "situation_28", number: 28, text: "Sie suchen einen Elektriker.", correctAdvertisementId: "x", explanation: { de: "Keine Anzeige passt." } },
        ],
        advertisements: "abcdefgh".split("").map((l) => ({ id: l, type: "JOBS", content: { headline: `Titel ${l}`, description: `Text ${l}` } })),
    } as unknown as ExercisePreviewData;

    it("shows all eight advertisements and keeps the answer key and explanations in the admin-only view", () => {
        const { rerender } = render(<ExerciseView preview={preview} showAnswers={false} />);
        expect(screen.getAllByRole("article")).toHaveLength(8);
        expect(screen.queryByText(/Correct answers \(admin only\)/)).toBeNull();
        expect(screen.queryByText(/Anzeige b sucht Hilfe/)).toBeNull();

        rerender(<ExerciseView preview={preview} showAnswers />);
        expect(screen.getByText(/Correct answers \(admin only\)/).parentElement?.textContent).toContain("28 → X");
        expect(screen.getByText(/Anzeige b sucht Hilfe am Wochenende\./)).toBeTruthy();
        expect(screen.getByText(/Keine Anzeige passt\./)).toBeTruthy();
    });
});
