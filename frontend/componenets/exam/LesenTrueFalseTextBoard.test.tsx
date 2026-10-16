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
    { id: "t1", label: "Informationen für Eltern", content: "<p>Die Betreuung ist montags bis freitags geöffnet.</p>", imageUrl: null, audioUrl: null },
] as unknown as ExamPassagePublic[];

const questions = [37, 38, 39].map((n) => ({
    id: `q${n}`, taskType: "TRUE_FALSE", prompt: `Aussage ${n}`, sectionIndex: 0, options: null, gapNumber: null, questionNumber: n,
})) as unknown as ExamQuestionPublic[];

function Harness({ onChange }: Readonly<{ onChange?: (a: Record<string, string>) => void }>) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [shown, setShown] = useState(true);
    return (
        <>
            <button onClick={() => setShown((v) => !v)}>toggle</button>
            {shown && (
                <LesenTextQuestionsBoard
                    passages={passages}
                    questions={questions}
                    answers={answers}
                    disabled={false}
                    onAnswer={(id, value) => setAnswers((prev) => { const next = { ...prev, [id]: value }; onChange?.(next); return next; })}
                />
            )}
        </>
    );
}

afterEach(cleanup);

describe("DTZ Lesen Teil 4 learner board", () => {
    it("shows the full text first, followed by the statements 37–39 with richtig / falsch radios", () => {
        render(<Harness />);
        expect(screen.getAllByRole("region")).toHaveLength(1);
        expect(screen.getByText("Die Betreuung ist montags bis freitags geöffnet.")).toBeTruthy();
        expect(screen.getByText("37")).toBeTruthy();
        expect(screen.getByText("39")).toBeTruthy();
        expect(screen.getAllByRole("radiogroup")).toHaveLength(3);
        expect(screen.getAllByRole("radio", { name: "richtig" })).toHaveLength(3);
        expect(screen.getAllByRole("radio", { name: "falsch" })).toHaveLength(3);
        expect(screen.queryByText(/nicht im text/i)).toBeNull();
    });

    it("lets the learner choose one answer per statement and change it", () => {
        const seen: Record<string, string>[] = [];
        render(<Harness onChange={(a) => seen.push(a)} />);
        const groups = screen.getAllByRole("radiogroup");
        fireEvent.click(screen.getAllByRole("radio", { name: "richtig" })[0]);
        fireEvent.click(screen.getAllByRole("radio", { name: "falsch" })[1]);
        fireEvent.click(screen.getAllByRole("radio", { name: "richtig" })[2]);
        fireEvent.click(screen.getAllByRole("radio", { name: "falsch" })[2]);
        expect(groups).toHaveLength(3);
        expect(seen.at(-1)).toEqual({ q37: "RICHTIG", q38: "FALSCH", q39: "FALSCH" });
        expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(3);
    });

    it("keeps the selected answers when the learner scrolls away and back (state lives above the board)", () => {
        render(<Harness />);
        fireEvent.click(screen.getAllByRole("radio", { name: "falsch" })[0]);
        fireEvent.click(screen.getByText("toggle"));
        expect(screen.queryAllByRole("radio")).toHaveLength(0);
        fireEvent.click(screen.getByText("toggle"));
        expect(screen.getAllByRole("radio", { name: "falsch" })[0].getAttribute("aria-checked")).toBe("true");
    });
});
