// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HoerenMatchingBoard from "./HoerenMatchingBoard";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";

vi.mock("@/componenets/LessonMarkdown", () => ({ default: ({ content }: { content: string }) => <div>{content}</div> }));
vi.mock("@/componenets/AudioPlayer", () => ({ default: ({ src }: { src: string }) => <audio data-testid="player" src={src} /> }));
vi.mock("@/lib/backendOrigin", () => ({ resolveUploadUrl: (u: string | null) => u }));

const passages = [{ id: "d1", label: "Diskussion", content: "", imageUrl: null, audioUrl: "/uploads/exam-audio/d1.mp3" }] as unknown as ExamPassagePublic[];
const questions = [
    { id: "q18", taskType: "STATEMENT_MATCHING", prompt: "Person 1: Frau Keller", sectionIndex: 0, options: null, gapNumber: null, questionNumber: 18 },
    { id: "q19", taskType: "STATEMENT_MATCHING", prompt: "Person 2: Herr Weber", sectionIndex: 0, options: null, gapNumber: null, questionNumber: 19 },
] as unknown as ExamQuestionPublic[];
const statements = ["Ich fahre lieber mit dem Rad.", "Das Auto ist bequemer.", "Die Bahn ist zu teuer."];

function Harness({ onChange }: Readonly<{ onChange?: (a: Record<string, string>) => void }>) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    return (
        <HoerenMatchingBoard
            passages={passages}
            questions={questions}
            answerOptions={statements}
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

describe("HoerenMatchingBoard", () => {
    it("plays the recording and lists the statements and the persons", () => {
        render(<Harness />);
        expect(screen.getByTestId("player")).toHaveProperty("src", expect.stringContaining("d1.mp3"));
        expect(screen.getByText(statements[2])).toBeTruthy();
        expect(screen.getByText("Person 2: Herr Weber")).toBeTruthy();
        expect(screen.getAllByRole("radio")).toHaveLength(questions.length * statements.length);
    });

    it("answers with the statement text and blocks a statement that another person already took", () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);
        fireEvent.click(screen.getByRole("radio", { name: "Aufgabe 18: Aussage b" }));
        expect(onChange).toHaveBeenLastCalledWith({ q18: statements[1] });
        expect((screen.getByRole("radio", { name: "Aufgabe 19: Aussage b" }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole("radio", { name: "Aufgabe 19: Aussage a" }) as HTMLButtonElement).disabled).toBe(false);
        // Clicking the chosen statement again releases it.
        fireEvent.click(screen.getByRole("radio", { name: "Aufgabe 18: Aussage b" }));
        expect(onChange).toHaveBeenLastCalledWith({ q18: "" });
        expect((screen.getByRole("radio", { name: "Aufgabe 19: Aussage b" }) as HTMLButtonElement).disabled).toBe(false);
    });
});
