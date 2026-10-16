// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ExerciseView } from "./shared";
import { ExercisePreviewData } from "@/types/examContent";

const task = (label: string, type: string, name: string, role: string) => ({
    label,
    title: `Titel ${label}`,
    topic: `Thema ${label}`,
    communicationType: type,
    situation: `Situation von Aufgabe ${label}`,
    recipientName: name,
    recipientRole: role,
    writingInstruction: `Schreiben Sie an ${name}.`,
    points: [1, 2, 3, 4].map((n) => `Punkt ${label}${n}`),
});

const preview: ExercisePreviewData = {
    title: "Schriftliche Kommunikation im Alltag",
    instructions: "Wählen Sie Aufgabe A oder Aufgabe B. Zeigen Sie, was Sie können.",
    headings: [],
    texts: [],
    writingChoice: {
        durationMinutes: 30,
        languageLevel: "A2_B1",
        tasks: [task("A", "FORMAL_EMAIL", "Herr Schmidt", "Mitarbeiter"), task("B", "INFORMAL_EMAIL", "Lena", "Freundin")],
    },
};

afterEach(cleanup);

describe("DTZ Schreiben admin preview", () => {
    it("shows the writing time, the instructions and both alternatives with their four points", () => {
        render(<ExerciseView preview={preview} />);
        expect(screen.getByText("30 Minuten")).toBeTruthy();
        expect(screen.getByText(/Wählen Sie Aufgabe A oder Aufgabe B/)).toBeTruthy();
        const a = within(screen.getByRole("article", { name: "Aufgabe A" }));
        const b = within(screen.getByRole("article", { name: "Aufgabe B" }));
        expect(a.getByText("Situation von Aufgabe A")).toBeTruthy();
        expect(a.getByText("Schreiben Sie an Herr Schmidt.")).toBeTruthy();
        expect(a.getByText(/Herr Schmidt, Mitarbeiter/)).toBeTruthy();
        expect(a.getAllByRole("listitem")).toHaveLength(4);
        expect(b.getAllByRole("listitem")).toHaveLength(4);
        expect(b.getByText("Punkt B4")).toBeTruthy();
        expect(a.getByText("Formelle E-Mail")).toBeTruthy();
        expect(b.getByText("Informelle E-Mail")).toBeTruthy();
    });

    it("switches to a single alternative as the learner sees it after choosing", () => {
        render(<ExerciseView preview={preview} />);
        fireEvent.click(screen.getByRole("radio", { name: "Aufgabe B only" }));
        expect(screen.queryByRole("article", { name: "Aufgabe A" })).toBeNull();
        expect(screen.getByRole("article", { name: "Aufgabe B" })).toBeTruthy();
        fireEvent.click(screen.getByRole("radio", { name: "Aufgabe A only" }));
        expect(screen.getByRole("article", { name: "Aufgabe A" })).toBeTruthy();
        expect(screen.queryByRole("article", { name: "Aufgabe B" })).toBeNull();
        fireEvent.click(screen.getByRole("radio", { name: "Exam page (A and B)" }));
        expect(screen.getAllByRole("article")).toHaveLength(2);
    });

    it("never shows a model answer and has no radio to choose a task", () => {
        render(<ExerciseView preview={preview} />);
        expect(screen.queryByText(/Musterlösung|mögliche Antwort|model answer/i)).toBeNull();
        expect(screen.queryByRole("radio", { name: /wählen/ })).toBeNull();
    });

});
