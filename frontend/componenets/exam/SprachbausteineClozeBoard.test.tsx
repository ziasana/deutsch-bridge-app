// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SprachbausteineClozeBoard, { hasGapText } from "./SprachbausteineClozeBoard";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";

vi.mock("@/lib/backendOrigin", () => ({ resolveUploadUrl: (u: string | null) => u, resolveUploadUrlsInHtml: (h: string) => h }));

const gap = (n: number) => `<span data-exam-gap="${n}" class="exam-gap-marker">${n}</span>`;
const passages = [
    { id: "p1", label: "Text", content: `<p>Ich fahre ${gap(21)} dem Zug nach Berlin und komme ${gap(22)} acht Uhr an.</p>`, imageUrl: null, audioUrl: null },
] as unknown as ExamPassagePublic[];
const questions = [
    { id: "q21", taskType: "MULTIPLE_CHOICE", prompt: "Lücke 21", sectionIndex: 0, options: ["mit", "von", "zu"], gapNumber: 21, questionNumber: 21 },
    { id: "q22", taskType: "MULTIPLE_CHOICE", prompt: "Lücke 22", sectionIndex: 0, options: ["um", "an", "auf"], gapNumber: 22, questionNumber: 22 },
] as unknown as ExamQuestionPublic[];

function Harness({ onChange, wordBank }: Readonly<{ onChange?: (a: Record<string, string>) => void; wordBank?: { options: string[]; labels: string[] } }>) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    return (
        <SprachbausteineClozeBoard
            passages={passages}
            questions={questions}
            answers={answers}
            disabled={false}
            wordBank={wordBank}
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

describe("SprachbausteineClozeBoard", () => {
    it("detects gap texts", () => {
        expect(hasGapText(passages, questions)).toBe(true);
        expect(hasGapText([{ ...passages[0], content: "<p>Kein Marker</p>" }], questions)).toBe(false);
    });

    it("turns the gap badges into chips inside the sentence", () => {
        render(<Harness />);
        expect(screen.getByRole("button", { name: "Lücke 21, noch offen" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Lücke 22, noch offen" })).toBeTruthy();
        expect(screen.getByText("0/2 ausgefüllt")).toBeTruthy();
    });

    it("fills the gap with the chosen word and moves on to the next open gap", () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);
        const dock = () => within(screen.getByRole("group", { name: /Wort für Lücke/ }));
        fireEvent.click(dock().getByRole("button", { name: /mit/ }));
        expect(onChange).toHaveBeenLastCalledWith({ q21: "mit" });
        expect(screen.getByRole("button", { name: "Lücke 21, mit" })).toBeTruthy();
        expect(screen.getByRole("group", { name: "Wort für Lücke 22 wählen" })).toBeTruthy();

        fireEvent.click(dock().getByRole("button", { name: /um/ }));
        expect(onChange).toHaveBeenLastCalledWith({ q21: "mit", q22: "um" });
        expect(screen.getByText("2/2 ausgefüllt")).toBeTruthy();
    });

    it("lets the learner jump to a gap by clicking it and change the answer", () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);
        fireEvent.click(screen.getByRole("button", { name: "Lücke 22, noch offen" }));
        expect(screen.getByRole("group", { name: "Wort für Lücke 22 wählen" })).toBeTruthy();
        fireEvent.click(within(screen.getByRole("group", { name: /Wort für Lücke/ })).getByRole("button", { name: /auf/ }));
        expect(onChange).toHaveBeenLastCalledWith({ q22: "auf" });
    });
});

describe("SprachbausteineClozeBoard with a word bank", () => {
    const bank = { options: ["weil", "obwohl", "damit", "denn"], labels: [] };
    const bankQuestions = questions.map((q) => ({ ...q, options: null })) as unknown as ExamQuestionPublic[];

    it("accepts gap texts whose questions have no own options only with a word bank", () => {
        expect(hasGapText(passages, bankQuestions)).toBe(false);
        expect(hasGapText(passages, bankQuestions, true)).toBe(true);
    });

    function BankHarness({ onChange }: Readonly<{ onChange: (a: Record<string, string>) => void }>) {
        const [answers, setAnswers] = useState<Record<string, string>>({});
        return (
            <SprachbausteineClozeBoard
                passages={passages}
                questions={bankQuestions}
                answers={answers}
                disabled={false}
                wordBank={bank}
                onAnswer={(id, value) =>
                    setAnswers((prev) => {
                        const next = { ...prev };
                        if (value) next[id] = value;
                        else delete next[id];
                        onChange(next);
                        return next;
                    })
                }
            />
        );
    }

    it("offers the shared words with letters and moves a used word over to the active gap", () => {
        const onChange = vi.fn();
        render(<BankHarness onChange={onChange} />);
        const word = (name: RegExp) => within(screen.getByRole("group", { name: /Wort für Lücke/ })).getByRole("button", { name });
        fireEvent.click(word(/weil/));
        expect(onChange).toHaveBeenLastCalledWith({ q21: "weil" });
        // Gap 22 is active now; taking the same word moves it from gap 21.
        fireEvent.click(word(/weil/));
        expect(onChange).toHaveBeenLastCalledWith({ q22: "weil" });
        expect(screen.getByRole("button", { name: "Lücke 21, noch offen" })).toBeTruthy();
    });
});
