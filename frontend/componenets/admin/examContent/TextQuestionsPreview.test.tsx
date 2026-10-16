// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ExerciseView } from "./shared";
import { ExercisePreviewData } from "@/types/examContent";
import { getAdminNavItems } from "@/componenets/layout/navConfig";

const preview: ExercisePreviewData = {
    title: "Neuigkeiten aus dem Alltag",
    instructions: "Lesen Sie die drei Texte.",
    headings: [],
    texts: [],
    textQuestions: {
        topic: "Öffentliche Informationen",
        languageLevel: "A2_B1",
        texts: [1, 2, 3].map((n) => ({
            id: `text_${n}`,
            number: n,
            type: n === 2 ? "EMAIL" : "PRESS_TEXT",
            title: `Titel ${n}`,
            sender: n === 2 ? "Frau Weber" : null,
            date: null,
            body: `Inhalt von Text ${n}.`,
            tasks: [
                { number: 29 + n * 2, type: "TRUE_FALSE", prompt: `Aussage ${n}`, options: [], correctAnswer: "FALSCH", explanation: { de: `DE ${n}`, en: `EN ${n}`, fa: `FA ${n}` } },
                {
                    number: 30 + n * 2,
                    type: "MULTIPLE_CHOICE",
                    prompt: `Frage ${n}`,
                    options: [{ id: "a", text: "Erste" }, { id: "b", text: "Zweite" }, { id: "c", text: "Dritte" }],
                    correctAnswer: "b",
                    explanation: { de: `DE MC ${n}`, en: `EN MC ${n}`, fa: `FA MC ${n}` },
                },
            ],
        })),
    },
};

afterEach(cleanup);

describe("DTZ Lesen Teil 3 preview", () => {
    it("shows all three texts, each followed by its two tasks, without the answer key", () => {
        render(<ExerciseView preview={preview} />);
        expect(screen.getAllByRole("region")).toHaveLength(3);
        expect(screen.getByText("Inhalt von Text 2.")).toBeTruthy();
        expect(screen.getByText("Frau Weber")).toBeTruthy();
        expect(screen.getByText(/31\. Aussage 1/)).toBeTruthy();
        expect(screen.getByText(/36\. Frage 3/)).toBeTruthy();
        expect(screen.getAllByText("Richtig")).toHaveLength(3);
        expect(screen.getAllByText("Falsch")).toHaveLength(3);
        expect(screen.queryByText("DE 1")).toBeNull();
        expect(screen.queryByText(/Correct:/)).toBeNull();
    });

    it("shows the correct answers and the de / en / fa explanations after the admin switches the answer key on", () => {
        render(<ExerciseView preview={preview} />);
        fireEvent.click(screen.getByLabelText(/Show answer key/));
        expect(screen.getByText("DE 1")).toBeTruthy();
        expect(screen.getByText("EN MC 3")).toBeTruthy();
        expect(screen.getByText("FA 2")).toBeTruthy();
        expect(screen.getAllByText(/Correct:/)).toHaveLength(6);
        fireEvent.click(screen.getByLabelText(/Show answer key/));
        expect(screen.queryByText("DE 1")).toBeNull();
    });

    it("reaches the DTZ exercises through the exam filter of the Telc pages, not through links of their own", () => {
        const dictionary = new Proxy({}, { get: () => new Proxy({}, { get: (_target, key) => String(key) }) });
        const hrefs = getAdminNavItems(dictionary as never).flatMap((item) => item.children ?? [item]).map((item) => item.href);
        expect(hrefs.filter((href) => href?.includes("/dtz-"))).toEqual([]);
        for (const page of ["leseverstehen", "hoerverstehen", "schriftlicher-ausdruck", "muendlicher-ausdruck"]) {
            expect(hrefs).toContain(`/admin/exam-prep/${page}`);
        }
    });
});
