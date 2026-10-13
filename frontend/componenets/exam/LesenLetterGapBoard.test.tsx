// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SprachbausteineClozeBoard, { hasGapText } from "./SprachbausteineClozeBoard";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";

vi.mock("@/lib/backendOrigin", () => ({ resolveUploadUrl: (u: string | null) => u, resolveUploadUrlsInHtml: (h: string) => h }));

/** DTZ Lesen Teil 5 as the learner API delivers it: an unscored example passage, the letter with the badges 40-45, six questions without an answer key. */
const gap = (n: number) => `<span data-exam-gap="${n}" class="exam-gap-marker">${n}</span>`;
const passages = [
    { id: "p0", label: "Beispiel", content: "<p>Sehr <strong><u>geehrte</u></strong> Damen und Herren,</p><p>a) geehrte<br>b) geehrten<br>c) geehrter</p>", imageUrl: null, audioUrl: null },
    {
        id: "p1", label: "Beschwerde", imageUrl: null, audioUrl: null,
        content: `<p class="letter-head">An: Hotel Zum Löwen<br>Betreff: <strong>Beschwerde</strong></p><p>Wir haben ${[40, 41, 42, 43, 44, 45].map((n) => `Satz ${gap(n)}.`).join(" ")}</p>`,
    },
] as unknown as ExamPassagePublic[];
const options: Record<number, string[]> = {
    40: ["mein", "meinem", "meinen"], 41: ["denn", "dass", "obwohl"], 42: ["mit", "bei", "für"],
    43: ["war", "ist", "wurde"], 44: ["zurück", "vorher", "danach"], 45: ["auf", "an", "über"],
};
const questions = [40, 41, 42, 43, 44, 45].map((n) => ({
    id: `q${n}`, taskType: "MULTIPLE_CHOICE", prompt: `Lücke ${n}`, sectionIndex: 1, options: options[n], gapNumber: n, questionNumber: n,
})) as unknown as ExamQuestionPublic[];

function Harness({ onChange, highlight }: Readonly<{ onChange?: (a: Record<string, string>) => void; highlight?: boolean }>) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    return (
        <SprachbausteineClozeBoard
            passages={passages}
            questions={questions}
            answers={answers}
            disabled={false}
            highlight={highlight}
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

describe("DTZ Lesen Teil 5 learner board", () => {
    it("is recognised as a gap text and shows six open gaps 40–45, the letter and the example", () => {
        expect(hasGapText(passages, questions)).toBe(true);
        render(<Harness />);
        for (const n of [40, 41, 42, 43, 44, 45]) expect(screen.getByRole("button", { name: `Lücke ${n}, noch offen` })).toBeTruthy();
        expect(screen.getByText("0/6 ausgefüllt")).toBeTruthy();
        expect(screen.getByText(/Hotel Zum Löwen/)).toBeTruthy();
        // the example is plain text, not a gap: only six chips exist
        expect(screen.getAllByRole("button", { name: /^Lücke \d+/ })).toHaveLength(6);
        expect(screen.getByText("geehrte", { selector: "u" })).toBeTruthy();
    });

    it("offers exactly three options for the active gap and lets the learner pick one", () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);
        const dock = () => within(screen.getByRole("group", { name: /Wort für Lücke/ }));
        expect(dock().getAllByRole("button")).toHaveLength(3);
        fireEvent.click(dock().getByRole("button", { name: /meinem/ }));
        expect(onChange).toHaveBeenLastCalledWith({ q40: "meinem" });
        expect(screen.getByRole("button", { name: "Lücke 40, meinem" })).toBeTruthy();
        expect(screen.getByRole("group", { name: "Wort für Lücke 41 wählen" })).toBeTruthy();
    });

    it("keeps the selections when the learner jumps between gaps, and one option per gap", () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);
        fireEvent.click(within(screen.getByRole("group", { name: /Wort für Lücke/ })).getByRole("button", { name: /meinem/ }));
        fireEvent.click(screen.getByRole("button", { name: "Lücke 45, noch offen" }));
        fireEvent.click(within(screen.getByRole("group", { name: /Wort für Lücke/ })).getByRole("button", { name: /auf/ }));
        fireEvent.click(screen.getByRole("button", { name: "Lücke 40, meinem" }));
        fireEvent.click(within(screen.getByRole("group", { name: /Wort für Lücke/ })).getByRole("button", { name: /mein$/ }));
        expect(onChange).toHaveBeenLastCalledWith({ q40: "mein", q45: "auf" });
        expect(screen.getByText("2/6 ausgefüllt")).toBeTruthy();
    });

    it("shows the marker toolbar under the card header for the letter, and not for other gap texts", () => {
        vi.stubGlobal("CSS", { highlights: new Map() });
        vi.stubGlobal("Highlight", class {});
        const { unmount } = render(<Harness highlight />);
        const header = screen.getByText("Ergänze den Text").closest("header")!;
        const toolbar = screen.getByRole("toolbar", { name: "Markierstift" });
        expect(header.compareDocumentPosition(toolbar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(screen.getAllByRole("button", { name: /^Markieren:/ })).toHaveLength(4);
        expect(screen.getByRole("button", { name: "Lücke 40, noch offen" })).toBeTruthy();
        unmount();
        render(<Harness />);
        expect(screen.queryByRole("toolbar")).toBeNull();
        vi.unstubAllGlobals();
    });
});
