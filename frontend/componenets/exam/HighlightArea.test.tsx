// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HighlightArea from "./HighlightArea";
import LesenTextQuestionsBoard from "./LesenTextQuestionsBoard";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";

vi.mock("@/componenets/LessonMarkdown", () => ({
    default: ({ content }: { content: string }) => <div>{content.replace(/<[^>]+>/g, "")}</div>,
}));
vi.mock("@/lib/backendOrigin", () => ({ resolveUploadUrl: (u: string | null) => u }));

const supported = () => {
    const highlights = new Map<string, unknown>();
    vi.stubGlobal("CSS", { highlights });
    vi.stubGlobal("Highlight", class { constructor(public ranges: Range[]) {} });
    return highlights;
};

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

describe("HighlightArea", () => {
    it("shows the content without a toolbar when the browser cannot highlight", () => {
        render(<HighlightArea><p>Der Text</p></HighlightArea>);
        expect(screen.getByText("Der Text")).toBeTruthy();
        expect(screen.queryByRole("toolbar")).toBeNull();
    });

    it("offers four colours, the eraser and a mode hint above the content", () => {
        supported();
        render(<HighlightArea><p>Der Text</p></HighlightArea>);
        expect(screen.getByRole("toolbar", { name: "Markierstift" })).toBeTruthy();
        expect(screen.getAllByRole("button", { name: /^Markieren:/ })).toHaveLength(4);
        expect(screen.getByText("Ziehe über eine Textstelle, um sie zu markieren.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Markieren: Gelb" }));
        expect(screen.getByText("Wähle eine Farbe, um wichtige Stellen zu markieren.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Radierer" }));
        expect(screen.getByText(/Tippe auf eine Markierung/)).toBeTruthy();
    });

    it("is available on the DTZ Lesen Teil 4 text board once the board is wrapped", () => {
        supported();
        const passages = [{ id: "t1", label: "Text", content: "<p>Das Zentrum ist offen.</p>", imageUrl: null, audioUrl: null }] as unknown as ExamPassagePublic[];
        const questions = [{ id: "q37", taskType: "TRUE_FALSE", prompt: "Aussage", sectionIndex: 0, options: null, gapNumber: null, questionNumber: 37 }] as unknown as ExamQuestionPublic[];
        render(
            <HighlightArea>
                <LesenTextQuestionsBoard passages={passages} questions={questions} answers={{}} disabled={false} onAnswer={() => {}} />
            </HighlightArea>,
        );
        expect(screen.getByRole("toolbar", { name: "Markierstift" })).toBeTruthy();
        expect(screen.getByText("Das Zentrum ist offen.")).toBeTruthy();
    });
});
