// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LesenTextQuestionsBoard from "./LesenTextQuestionsBoard";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";

vi.mock("@/componenets/LessonMarkdown", () => ({
    default: ({ content }: { content: string }) => <div dangerouslySetInnerHTML={{ __html: content }} />,
}));
vi.mock("@/lib/backendOrigin", () => ({ resolveUploadUrl: (u: string | null) => u }));

const text = (content: string) =>
    [{ id: "t1", label: "Stadtteilzentrum", content, imageUrl: null, audioUrl: null }] as unknown as ExamPassagePublic[];
const statements = [37, 38, 39].map((n) => ({
    id: `q${n}`, taskType: "TRUE_FALSE", prompt: `Aussage ${n}`, sectionIndex: 0, options: null, gapNumber: null, questionNumber: n,
})) as unknown as ExamQuestionPublic[];
const CONTENT = "<p>Das Zentrum ist für alle offen.</p><p>Öffnungszeiten<br>Das Zentrum ist montags geöffnet.</p><p>Mitgliedschaft und Gebühren<br>Die Mitgliedschaft kostet 12 Euro.</p>";

afterEach(cleanup);

describe("DTZ Lesen Teil 4 information text", () => {
    it("shows the subtitles as headings", () => {
        render(<LesenTextQuestionsBoard passages={text(CONTENT)} questions={statements} answers={{}} disabled={false} onAnswer={() => {}} />);
        expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Öffnungszeiten", "Mitgliedschaft und Gebühren"]);
        expect(screen.getByText("Das Zentrum ist montags geöffnet.")).toBeTruthy();
    });

    it("leaves the texts of Teil 3 (several texts, other task types) as they are", () => {
        const two = [...text(CONTENT), ...text(CONTENT)].map((p, i) => ({ ...p, id: `t${i}` }));
        render(<LesenTextQuestionsBoard passages={two} questions={statements} answers={{}} disabled={false} onAnswer={() => {}} />);
        expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
    });
});
