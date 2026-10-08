// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LesenTeil3Board, { NO_AD_ANSWER } from "./LesenTeil3Board";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";

vi.mock("@/componenets/LessonMarkdown", () => ({
    default: ({ content }: { content: string }) => <div>{content.replace(/<[^>]+>/g, "")}</div>,
}));
vi.mock("@/lib/backendOrigin", () => ({ resolveUploadUrl: (u: string | null) => u }));

const letters = "abcdefghijkl".split("");
const passages = letters.map((l) => ({
    id: `p-${l}`,
    label: l,
    content: `<p><strong>Anzeige ${l}</strong></p>`,
    imageUrl: l === "a" ? "/uploads/a.jpg" : null,
    audioUrl: null,
})) as unknown as ExamPassagePublic[];
const questions = Array.from({ length: 10 }, (_, i) => ({
    id: `q${11 + i}`,
    taskType: "SITUATION_MATCHING",
    prompt: `Situation Text ${11 + i}`,
    sectionIndex: null,
    options: null,
    gapNumber: null,
    questionNumber: 11 + i,
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

describe("LesenTeil3Board", () => {
    it("renders 10 situations, 12 advertisements, x and the ad image", () => {
        const { container } = render(<Harness />);
        expect(screen.getAllByRole("article")).toHaveLength(12);
        expect(screen.getByRole("navigation", { name: "Situationen" }).querySelectorAll("button")).toHaveLength(10);
        expect(screen.getByRole("button", { name: "x: keine passende Anzeige" })).toBeTruthy();
        expect(container.querySelectorAll("img")).toHaveLength(1);
        expect(screen.getAllByText("Situation Text 11").length).toBeGreaterThan(0);
    });

    it("selects an advertisement, advances to the next open situation and allows changing", () => {
        let latest: Record<string, string> = {};
        render(<Harness onChange={(a) => (latest = a)} />);
        fireEvent.click(screen.getByRole("button", { name: "Anzeige d für Situation 11 wählen" }));
        expect(latest).toEqual({ q11: "p-d" });
        expect(screen.getByText(/Situation 12 · 2 von 10/)).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: /^Situation 11, Antwort Anzeige d/ }));
        fireEvent.click(screen.getByRole("button", { name: "Anzeige f für Situation 11 wählen" }));
        expect(latest).toEqual({ q11: "p-f" });
    });

    it("moves an advertisement over when another situation takes it (one use only)", () => {
        let latest: Record<string, string> = {};
        render(<Harness onChange={(a) => (latest = a)} />);
        fireEvent.click(screen.getByRole("button", { name: "Anzeige d für Situation 11 wählen" }));
        fireEvent.click(screen.getByRole("button", { name: "Anzeige d für Situation 12 wählen" }));
        expect(latest).toEqual({ q12: "p-d" });
    });

    it("supports x, deselecting and previous / next navigation", () => {
        let latest: Record<string, string> = {};
        render(<Harness onChange={(a) => (latest = a)} />);
        fireEvent.click(screen.getByRole("button", { name: "x: keine passende Anzeige" }));
        expect(latest).toEqual({ q11: NO_AD_ANSWER });
        fireEvent.click(screen.getByRole("button", { name: "Zurück" }));
        expect(screen.getByText(/Situation 11 · 1 von 10/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "x: keine passende Anzeige" }));
        expect(latest).toEqual({});
        fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
        expect(screen.getByText(/Situation 12 · 2 von 10/)).toBeTruthy();
    });
});
