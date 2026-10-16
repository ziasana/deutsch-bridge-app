// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LesenTextQuestionsBoard from "./LesenTextQuestionsBoard";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";

vi.mock("@/componenets/LessonMarkdown", () => ({
    default: ({ content }: { content: string }) => <div>{content.replace(/<[^>]+>/g, "")}</div>,
}));
vi.mock("@/lib/backendOrigin", () => ({ resolveUploadUrl: (u: string | null) => u }));

const passages = [
    { id: "t1", label: "Text 1", content: "<p>Das Bürgerbüro öffnet.</p>", imageUrl: null, audioUrl: null },
    { id: "t2", label: "Text 2", content: "<p>Der Kurs beginnt.</p>", imageUrl: null, audioUrl: null },
] as unknown as ExamPassagePublic[];

const questions = [
    { id: "q31", taskType: "TRUE_FALSE", prompt: "Das Bürgerbüro wird geschlossen.", sectionIndex: 0, options: null, gapNumber: null, questionNumber: 31 },
    { id: "q32", taskType: "MULTIPLE_CHOICE", prompt: "Was kann man im Bürgerbüro machen?", sectionIndex: 0, options: ["Ein Auto anmelden.", "Einen Führerschein beantragen.", "Sich beraten lassen."], gapNumber: null, questionNumber: 32 },
    { id: "q33", taskType: "TRUE_FALSE", prompt: "Der Kurs ist kostenlos.", sectionIndex: 1, options: null, gapNumber: null, questionNumber: 33 },
    { id: "q34", taskType: "MULTIPLE_CHOICE", prompt: "Wann beginnt der Kurs?", sectionIndex: 1, options: ["Montag", "Dienstag", "Mittwoch"], gapNumber: null, questionNumber: 34 },
] as unknown as ExamQuestionPublic[];

function Harness({ onChange }: Readonly<{ onChange?: (a: Record<string, string>) => void }>) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    return (
        <LesenTextQuestionsBoard
            passages={passages}
            questions={questions}
            answers={answers}
            disabled={false}
            onAnswer={(id, value) =>
                setAnswers((prev) => {
                    const next = { ...prev, [id]: value };
                    onChange?.(next);
                    return next;
                })
            }
        />
    );
}

afterEach(cleanup);

describe("LesenTextQuestionsBoard", () => {
    it("shows every text with its two numbered tasks", () => {
        render(<Harness />);
        expect(screen.getAllByRole("region")).toHaveLength(2);
        expect(screen.getByText("Das Bürgerbüro öffnet.")).toBeTruthy();
        expect(screen.getByText("31")).toBeTruthy();
        expect(screen.getByText("34")).toBeTruthy();
        expect(screen.getAllByRole("radio", { name: "richtig" })).toHaveLength(2);
        expect(screen.getAllByRole("radio", { name: "falsch" })).toHaveLength(2);
        expect(screen.getByRole("radio", { name: /Einen Führerschein beantragen/ })).toBeTruthy();
    });

    it("never offers 'nicht im Text' for the richtig/falsch task", () => {
        render(<Harness />);
        expect(screen.queryByText(/nicht im text/i)).toBeNull();
    });

    it("reports a richtig/falsch pick as RICHTIG/FALSCH and a multiple-choice pick as the option text", () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);
        fireEvent.click(screen.getAllByRole("radio", { name: "falsch" })[0]);
        fireEvent.click(screen.getByRole("radio", { name: /Sich beraten lassen/ }));
        expect(onChange).toHaveBeenLastCalledWith({ q31: "FALSCH", q32: "Sich beraten lassen." });
    });

    it("marks the chosen answer as checked, one per task", () => {
        render(<Harness />);
        const [first] = screen.getAllByRole("radio", { name: "richtig" });
        expect(first.getAttribute("aria-checked")).toBe("false");
        fireEvent.click(first);
        expect(first.getAttribute("aria-checked")).toBe("true");
        fireEvent.click(screen.getAllByRole("radio", { name: "falsch" })[0]);
        expect(first.getAttribute("aria-checked")).toBe("false");
    });

    it("groups each task's choices in a radio group, richtig/falsch and a, b, c", () => {
        render(<Harness />);
        expect(screen.getAllByRole("radiogroup")).toHaveLength(4);
        const mc = screen.getByRole("radiogroup", { name: "Aufgabe 32" });
        expect(mc.querySelectorAll('[role="radio"]')).toHaveLength(3);
        expect(Array.from(mc.querySelectorAll('[role="radio"] > span:first-child')).map((e) => e.textContent)).toEqual(["a", "b", "c"]);
    });
});
