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
    it("draws the source as a signboard and the example, and shows the first situation with its three options", () => {
        render(<Harness />);
        const board = screen.getByRole("region", { name: "Rathaus – Zentralwegweiser" });
        expect(within(board).getByText("4. OG")).toBeTruthy();
        expect(within(board).getByText("Umweltamt")).toBeTruthy();
        expect(screen.getByRole("region", { name: "Beispiel" })).toBeTruthy();
        expect(screen.getByText("Situation 21")).toBeTruthy();
        expect(screen.queryByText("Situation 22")).toBeNull();
        expect(screen.getAllByRole("button", { name: /^21-[ABC]$/ })).toHaveLength(3);
        expect(screen.getByText("Aufgabe 21 · 1 von 5")).toBeTruthy();
    });

    it("selects one answer per situation, moves on to the next open one and reports the option text", () => {
        const seen: Record<string, string>[] = [];
        render(<Harness onChange={(a) => seen.push(a)} />);
        fireEvent.click(screen.getByRole("button", { name: /21-B/ }));
        expect(seen.at(-1)).toEqual({ q21: "21-B" });
        expect(screen.getByText("Situation 22")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /22-B/ }));
        fireEvent.click(screen.getByRole("button", { name: "Aufgabe 22, beantwortet" }));
        fireEvent.click(screen.getByRole("button", { name: /22-C/ }));
        expect(seen.at(-1)).toEqual({ q21: "21-B", q22: "22-C" });
        expect(screen.getByRole("button", { name: /22-C/ }).getAttribute("aria-pressed")).toBe("true");
        expect(screen.getByRole("button", { name: /22-B/ }).getAttribute("aria-pressed")).toBe("false");
        expect(screen.getByText("2/5 beantwortet")).toBeTruthy();
        expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("2");
    });

    it("lets the learner jump to any situation and step with Zurück / Weiter", () => {
        render(<Harness />);
        fireEvent.click(screen.getByRole("button", { name: "Aufgabe 25, noch offen" }));
        expect(screen.getByText("Situation 25")).toBeTruthy();
        expect((screen.getByRole("button", { name: /Weiter/ }) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(screen.getByRole("button", { name: /Zurück/ }));
        expect(screen.getByText("Situation 24")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Aufgabe 24, noch offen" }));
        expect(screen.getByRole("button", { name: "Aufgabe 24, noch offen" }).getAttribute("aria-current")).toBe("step");
    });

    it("congratulates when all five are answered", () => {
        render(<Harness />);
        for (const n of [21, 22, 23, 24, 25]) fireEvent.click(screen.getByRole("button", { name: new RegExp(`${n}-A`) }));
        expect(screen.getByText(/Alle Aufgaben sind beantwortet/)).toBeTruthy();
    });

    it("searches the signboard: matches are marked, the other entries dimmed", () => {
        const { container } = render(<Harness />);
        const search = screen.getAllByLabelText("Im Wegweiser suchen")[0];
        fireEvent.change(search, { target: { value: "sperr" } });
        expect(screen.getAllByText("1 von 1 Einträgen").length).toBeGreaterThan(0);
        expect(container.querySelector("mark")?.textContent).toBe("Sperr");
        fireEvent.change(search, { target: { value: "xyz" } });
        expect(screen.getAllByText("Kein Treffer").length).toBeGreaterThan(0);
    });

    it("lets the learner pin entries", () => {
        render(<Harness />);
        const pin = screen.getAllByRole("button", { name: "Eintrag merken: 4. OG – Umweltamt" })[0];
        expect(pin.getAttribute("aria-pressed")).toBe("false");
        fireEvent.click(pin);
        expect(pin.getAttribute("aria-pressed")).toBe("true");
        fireEvent.click(pin);
        expect(pin.getAttribute("aria-pressed")).toBe("false");
    });

    it("shows a source without entries as plain text", () => {
        const plain = [{ ...passages[0], content: "<p>Nur ein freier Text.</p>" }];
        render(<LesenDirectoryBoard passages={plain as unknown as ExamPassagePublic[]} questions={questions} answers={{}} disabled={false} onAnswer={() => {}} />);
        expect(screen.getByText("Nur ein freier Text.")).toBeTruthy();
        expect(screen.queryByLabelText("Im Wegweiser suchen")).toBeNull();
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
        expect(document.body.textContent).not.toMatch(/correct|explanation/i);
    });
});
