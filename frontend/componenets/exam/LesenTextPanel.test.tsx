// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LesenTextPanel from "./LesenTextPanel";
import { ExamPassagePublic } from "@/types/exam";

vi.mock("@/componenets/LessonMarkdown", () => ({
    default: ({ content }: { content: string }) => <div>{content.replace(/<[^>]+>/g, "")}</div>,
}));
vi.mock("@/lib/backendOrigin", () => ({ resolveUploadUrl: (u: string | null) => u }));

const passages = [{ id: "p1", label: "Text", content: "<p>Der Zug fährt um acht Uhr ab.</p>", imageUrl: null, audioUrl: null }] as unknown as ExamPassagePublic[];

describe("LesenTextPanel", () => {
    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
    });

    it("shows the text and word count; no marker toolbar when the browser cannot highlight", () => {
        render(<LesenTextPanel passages={passages} />);
        expect(screen.getByText("Der Zug fährt um acht Uhr ab.")).toBeTruthy();
        expect(screen.getByText(/7 Wörter/)).toBeTruthy();
        expect(screen.queryByRole("toolbar")).toBeNull();
    });

    it("offers four marker colours and an eraser when highlighting is supported", () => {
        vi.stubGlobal("CSS", { highlights: new Map() });
        vi.stubGlobal("Highlight", class {});
        render(<LesenTextPanel passages={passages} />);
        expect(screen.getByRole("toolbar", { name: "Markierstift" })).toBeTruthy();
        expect(screen.getAllByRole("button", { name: /^Markieren:/ })).toHaveLength(4);
        const yellow = screen.getByRole("button", { name: "Markieren: Gelb" });
        expect(yellow.getAttribute("aria-pressed")).toBe("true");
        fireEvent.click(screen.getByRole("button", { name: "Radierer" }));
        expect(screen.getByRole("button", { name: "Radierer" }).getAttribute("aria-pressed")).toBe("true");
        expect(yellow.getAttribute("aria-pressed")).toBe("false");
    });
});
