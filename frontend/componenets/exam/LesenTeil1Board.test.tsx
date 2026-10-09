// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LesenTeil1Board from "./LesenTeil1Board";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";

vi.mock("@/componenets/LessonMarkdown", () => ({
    default: ({ content }: { content: string }) => <div>{content.replace(/<[^>]+>/g, "")}</div>,
}));
vi.mock("@/lib/backendOrigin", () => ({ resolveUploadUrl: (u: string | null) => u }));

const passages = [1, 2, 3].map((n) => ({
    id: `p${n}`,
    label: `Text ${n}`,
    content: `<p>Inhalt von Text ${n}</p>`,
    imageUrl: null,
    audioUrl: null,
})) as unknown as ExamPassagePublic[];
const questions = [1, 2, 3].map((n, i) => ({
    id: `q${n}`,
    taskType: "MATCHING",
    prompt: `Welche Überschrift passt zu Text ${n}?`,
    sectionIndex: i,
    options: null,
    gapNumber: null,
    questionNumber: n,
})) as unknown as ExamQuestionPublic[];
const headings = ["Reisen ohne Stress", "Neu im Verein", "Wohnen in der Stadt", "Gesundes Frühstück"];

function Harness({ onChange }: Readonly<{ onChange?: (a: Record<string, string>) => void }>) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    return (
        <LesenTeil1Board
            passages={passages}
            questions={questions}
            answerOptions={headings}
            answerOptionLabels={[]}
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

// The heading list is rendered twice (desktop sidebar + inline on a phone); the sidebar is the one inside the aside.
const sidebar = () => within(screen.getByLabelText("Überschriften"));

describe("LesenTeil1Board", () => {
    afterEach(cleanup);

    it("shows every text and starts with nothing assigned", () => {
        render(<Harness />);
        expect(screen.getByText("Inhalt von Text 1")).toBeTruthy();
        expect(screen.getByText("Inhalt von Text 3")).toBeTruthy();
        expect(screen.getByText("0/3 zugeordnet")).toBeTruthy();
    });

    it("puts a chosen heading into the active text and moves on to the next open text", () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);
        fireEvent.click(sidebar().getByRole("button", { name: /^b\) Neu im Verein/ }));
        expect(onChange).toHaveBeenLastCalledWith({ q1: "Neu im Verein" });
        expect(screen.getByText("1/3 zugeordnet")).toBeTruthy();

        fireEvent.click(sidebar().getByRole("button", { name: /^a\) Reisen ohne Stress/ }));
        expect(onChange).toHaveBeenLastCalledWith({ q1: "Neu im Verein", q2: "Reisen ohne Stress" });
    });

    it("lets the active text take over a heading another text already holds", () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);
        fireEvent.click(sidebar().getByRole("button", { name: /^a\) Reisen ohne Stress/ }));
        // Text 2 is now active; choosing the same heading moves it away from Text 1.
        fireEvent.click(sidebar().getByRole("button", { name: /^a\) Reisen ohne Stress/ }));
        expect(onChange).toHaveBeenLastCalledWith({ q2: "Reisen ohne Stress" });
    });

    it("removes an assigned heading again", () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);
        fireEvent.click(sidebar().getByRole("button", { name: /^c\) Wohnen in der Stadt/ }));
        fireEvent.click(screen.getByRole("button", { name: "Überschrift von Text 1 entfernen" }));
        expect(onChange).toHaveBeenLastCalledWith({});
    });
});
