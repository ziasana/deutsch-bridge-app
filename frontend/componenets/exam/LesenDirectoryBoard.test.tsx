// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LesenDirectoryBoard from "./LesenDirectoryBoard";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";

vi.mock("@/componenets/LessonMarkdown", () => ({
    default: ({ content }: { content: string }) => <div>{content.replace(/<[^>]+>/g, "")}</div>,
}));

const passages = [
    { id: "src", label: "Rathaus – Zentralwegweiser", content: "<p><strong>4. OG – Umweltamt</strong><br>Sperrmüll</p>", imageUrl: null, audioUrl: null },
    { id: "ex", label: "Beispiel", content: "<p>Sie möchten Hilfe für eine Ausbildung.</p>", imageUrl: null, audioUrl: null },
] as unknown as ExamPassagePublic[];

const questions = [21, 22, 23, 24, 25].map((n) => ({
    id: `q${n}`,
    taskType: "MULTIPLE_CHOICE",
    prompt: `Situation ${n}`,
    sectionIndex: 0,
    options: [`${n}-A`, `${n}-B`, `${n}-C`],
    gapNumber: null,
    questionNumber: n,
})) as unknown as ExamQuestionPublic[];

function Harness({ onChange }: Readonly<{ onChange?: (a: Record<string, string>) => void }>) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    return (
        <LesenDirectoryBoard
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

describe("LesenDirectoryBoard", () => {
    it("shows the information source, the example and the five numbered situations with three options each", () => {
        render(<Harness />);
        expect(screen.getByRole("region", { name: "Rathaus – Zentralwegweiser" })).toBeTruthy();
        expect(screen.getByRole("region", { name: "Beispiel" })).toBeTruthy();
        ["21", "22", "23", "24", "25"].forEach((n) => expect(screen.getByText(n)).toBeTruthy());
        expect(screen.getAllByRole("button", { name: /^\d\d-[ABC]$/ })).toHaveLength(15);
    });

    it("selects one answer per situation and reports the option text", () => {
        const seen: Record<string, string>[] = [];
        render(<Harness onChange={(a) => seen.push(a)} />);
        fireEvent.click(screen.getByRole("button", { name: /22-B/ }));
        fireEvent.click(screen.getByRole("button", { name: /22-C/ }));
        fireEvent.click(screen.getByRole("button", { name: /25-A/ }));
        expect(seen.at(-1)).toEqual({ q22: "22-C", q25: "25-A" });
        expect(screen.getByRole("button", { name: /22-C/ }).getAttribute("aria-pressed")).toBe("true");
        expect(screen.getByRole("button", { name: /22-B/ }).getAttribute("aria-pressed")).toBe("false");
    });

    it("opens the source in a panel on small screens and closes it with Escape", () => {
        render(<Harness />);
        expect(screen.queryByRole("dialog")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: /Rathaus – Zentralwegweiser/ }));
        const dialog = screen.getByRole("dialog");
        expect(within(dialog).getByText(/Umweltamt/)).toBeTruthy();
        fireEvent.keyDown(document, { key: "Escape" });
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("works without an example", () => {
        render(<LesenDirectoryBoard passages={[passages[0]]} questions={questions} answers={{}} disabled={false} onAnswer={() => {}} />);
        expect(screen.queryByRole("region", { name: "Beispiel" })).toBeNull();
    });

    it("never receives or shows an answer key", () => {
        render(<Harness />);
        expect(document.body.textContent).not.toMatch(/correct|richtig|explanation/i);
    });
});
