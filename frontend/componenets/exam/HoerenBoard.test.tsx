// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HoerenBoard from "./HoerenBoard";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";

vi.mock("@/componenets/AudioPlayer", () => ({ default: ({ src }: { src: string }) => <div data-testid="player">{src}</div> }));
vi.mock("@/componenets/LessonMarkdown", () => ({ default: ({ content }: { content: string }) => <div>{content}</div> }));
vi.mock("@/lib/backendOrigin", () => ({ resolveUploadUrl: (u: string | null) => u }));

const passages = [1, 2, 3].map((n) => ({ id: `p${n}`, label: `Text ${n}`, content: "", imageUrl: null, audioUrl: `/audio/${n}.mp3` })) as unknown as ExamPassagePublic[];
const questions = [
    { id: "q1", prompt: "Der Zug fährt von Gleis neun.", sectionIndex: 0, questionNumber: 1 },
    { id: "q2", prompt: "Die Bibliothek ist geschlossen.", sectionIndex: 1, questionNumber: 2 },
    { id: "q3", prompt: "Eine Aussage ohne Hörtext.", sectionIndex: null, questionNumber: 3 },
] as unknown as ExamQuestionPublic[];

function Harness({ onChange }: Readonly<{ onChange?: (a: Record<string, string>) => void }>) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    return (
        <HoerenBoard
            passages={passages}
            questions={questions}
            answerOptions={["+", "-"]}
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

describe("HoerenBoard", () => {
    it("puts each clip's player and statement in one card, and collects statements without a clip", () => {
        render(<Harness />);
        const card1 = within(screen.getByRole("article", { name: "Text 1" }));
        expect(card1.getByTestId("player").textContent).toBe("/audio/1.mp3");
        expect(card1.getByText("Der Zug fährt von Gleis neun.")).toBeTruthy();
        expect(within(screen.getByRole("article", { name: "Text 2" })).getByText("Die Bibliothek ist geschlossen.")).toBeTruthy();
        expect(within(screen.getByRole("article", { name: "Text 3" })).queryByText(/Gleis/)).toBeNull();
        expect(within(screen.getByRole("article", { name: "Weitere Aussagen" })).getByText("Eine Aussage ohne Hörtext.")).toBeTruthy();
    });

    it("answers with Richtig / Falsch, counts progress and allows deselecting", () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);
        expect(screen.getByText("0/3 beantwortet")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Aussage 1: Richtig (+)" }));
        expect(onChange).toHaveBeenLastCalledWith({ q1: "+" });
        fireEvent.click(screen.getByRole("button", { name: "Aussage 2: Falsch (-)" }));
        expect(onChange).toHaveBeenLastCalledWith({ q1: "+", q2: "-" });
        expect(screen.getByText("2/3 beantwortet")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Aussage 1: Richtig (+)" }));
        expect(onChange).toHaveBeenLastCalledWith({ q2: "-" });
    });
});

describe("HoerenBoard with one long recording", () => {
    const one = [passages[0]];
    const many = [1, 2, 3, 4].map((n) => ({ id: `s${n}`, prompt: `Aussage zum Interview ${n}`, sectionIndex: 0, questionNumber: 5 + n })) as unknown as ExamQuestionPublic[];

    it("shows a single player card with all statements as rows and answers them", () => {
        const onAnswer = vi.fn();
        render(<HoerenBoard passages={one} questions={many} answerOptions={["+", "-"]} answers={{ s1: "+" }} disabled={false} onAnswer={onAnswer} />);
        expect(screen.getAllByTestId("player")).toHaveLength(1);
        expect(screen.getByText("1 von 4 Aussagen beantwortet")).toBeTruthy();
        expect(screen.getByText("Aussage zum Interview 4")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Aussage 7: Falsch (-)" }));
        expect(onAnswer).toHaveBeenCalledWith("s2", "-");
    });
});

describe("HoerenBoard as Hörstation (Teil 3)", () => {
    it("shows one recording at a time and steps through them", () => {
        const onAnswer = vi.fn();
        render(
            <HoerenBoard teil={3} passages={passages} questions={questions.slice(0, 2)} answerOptions={["+", "-"]} answers={{}} disabled={false} onAnswer={onAnswer} />,
        );
        expect(screen.getAllByTestId("player")).toHaveLength(1);
        expect(screen.getByText("Text 1 · 1 von 3")).toBeTruthy();
        expect(screen.getByText("Der Zug fährt von Gleis neun.")).toBeTruthy();
        expect((screen.getByRole("button", { name: "Zurück" }) as HTMLButtonElement).disabled).toBe(true);

        fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
        expect(screen.getByText("Text 2 · 2 von 3")).toBeTruthy();
        expect(screen.getByTestId("player").textContent).toBe("/audio/2.mp3");
        fireEvent.click(screen.getByRole("button", { name: "Aussage 2: Richtig (+)" }));
        expect(onAnswer).toHaveBeenCalledWith("q2", "+");

        fireEvent.click(screen.getByRole("button", { name: "Text 1" }));
        expect(screen.getByText("Text 1 · 1 von 3")).toBeTruthy();
    });

    it("keeps the list of cards for other Teile", () => {
        render(<HoerenBoard teil={1} passages={passages} questions={questions.slice(0, 2)} answerOptions={["+", "-"]} answers={{}} disabled={false} onAnswer={vi.fn()} />);
        expect(screen.getAllByTestId("player")).toHaveLength(3);
    });
});
