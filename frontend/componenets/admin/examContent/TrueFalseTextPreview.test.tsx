// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ExerciseView } from "./shared";
import { ExercisePreviewData } from "@/types/examContent";
import { getAdminNavItems } from "@/componenets/layout/navConfig";

const preview: ExercisePreviewData = {
    title: "Mittagsbetreuung an der Grundschule",
    instructions: "Lesen Sie den Text. Entscheiden Sie, ob die Aussagen 37–39 richtig oder falsch sind.",
    headings: [],
    texts: [],
    textQuestions: {
        topic: "Schule und Kinderbetreuung",
        languageLevel: "A2_B1",
        texts: [
            {
                id: "text_1",
                number: 1,
                type: "INFORMATION_SHEET",
                title: "Informationen für Eltern",
                sender: null,
                date: null,
                body: "Die Mittagsbetreuung ist von Montag bis Freitag geöffnet.",
                tasks: [37, 38, 39].map((n, i) => ({
                    number: n,
                    type: "TRUE_FALSE",
                    prompt: `Aussage ${n}`,
                    options: [],
                    correctAnswer: i === 1 ? "FALSCH" : "RICHTIG",
                    explanation: { de: `DE ${n}`, en: `EN ${n}`, fa: `FA ${n}` },
                })),
            },
        ],
    },
};

afterEach(cleanup);

describe("DTZ Lesen Teil 4 preview", () => {
    it("shows the title, the complete text and the statements 37–39 without the answer key", () => {
        render(<ExerciseView preview={preview} />);
        expect(screen.getAllByRole("region")).toHaveLength(1);
        expect(screen.getByText("Informationen für Eltern")).toBeTruthy();
        expect(screen.getByText("Information sheet")).toBeTruthy();
        expect(screen.getByText("Die Mittagsbetreuung ist von Montag bis Freitag geöffnet.")).toBeTruthy();
        expect(screen.getByText(/37\. Aussage 37/)).toBeTruthy();
        expect(screen.getByText(/38\. Aussage 38/)).toBeTruthy();
        expect(screen.getByText(/39\. Aussage 39/)).toBeTruthy();
        expect(screen.getAllByText("Richtig")).toHaveLength(3);
        expect(screen.getAllByText("Falsch")).toHaveLength(3);
        expect(screen.queryByText("DE 37")).toBeNull();
        expect(screen.queryByText(/Correct:/)).toBeNull();
    });

    it("shows the correct answers and the de / en / fa explanations in the admin answer-key view", () => {
        render(<ExerciseView preview={preview} />);
        fireEvent.click(screen.getByLabelText(/Show answer key/));
        expect(screen.getAllByText(/Correct:/)).toHaveLength(3);
        expect(screen.getByText("DE 37")).toBeTruthy();
        expect(screen.getByText("EN 38")).toBeTruthy();
        expect(screen.getByText("FA 39")).toBeTruthy();
        fireEvent.click(screen.getByLabelText(/Show answer key/));
        expect(screen.queryByText("DE 37")).toBeNull();
    });

    it("is listed in the admin navigation after DTZ Lesen Teil 3", () => {
        const dictionary = new Proxy({}, { get: () => new Proxy({}, { get: (_target, key) => String(key) }) });
        const hrefs = getAdminNavItems(dictionary as never).flatMap((item) => item.children ?? [item]).map((item) => item.href);
        expect(hrefs).toContain("/admin/exam-prep/dtz-lesen-teil4");
        expect(hrefs.indexOf("/admin/exam-prep/dtz-lesen-teil4")).toBeGreaterThan(hrefs.indexOf("/admin/exam-prep/dtz-lesen-teil3"));
    });
});
