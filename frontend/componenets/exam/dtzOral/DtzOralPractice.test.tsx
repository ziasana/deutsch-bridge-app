// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DtzOralTeil3 } from "@/types/dtzOral";
import { SpeakingGuideContent } from "@/types/exam";
import DtzOralPractice from "./DtzOralPractice";

vi.mock("@/lib/backendOrigin", () => ({ resolveUploadUrl: (u: string | null) => u }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const teil3: DtzOralTeil3 = {
    part: 3,
    topic: "Klassenfest",
    situation: "Ihr Kurs feiert ein Fest.",
    taskInstruction: "Planen Sie gemeinsam, was Sie tun wollen.",
    planningNotes: ["Wann?", "Wo?", "Essen?", "Musik?"].map((label, i) => ({ number: i + 1, label })),
    learnerSupport: { examplePhrases: ["Ich schlage vor, dass ..."] },
    possibleSolution: { dialogue: [{ speaker: "A", text: "Wann feiern wir?" }, { speaker: "B", text: "Am Freitag." }, { speaker: "A", text: "Wo?" }, { speaker: "B", text: "Im Kursraum." }] },
};

const guide: SpeakingGuideContent = {
    intro: "In Teil 3 planen Sie gemeinsam.",
    tips: [{ title: "Begründen", text: "Nennen Sie einen Grund.", hint: { en: "Give a reason.", fa: "دلیل بیاورید." } }],
    steps: [],
    commonMistakes: ["Nur zustimmen."],
    selfAssessment: ["Ich habe Vorschläge gemacht.", "Wir haben uns geeinigt."],
    functions: [{ function: "SUGGEST", title: "Vorschläge machen", usefulPhrases: ["Wie wäre es, wenn wir ...?"], tip: "Freundlich bleiben." }],
};

const props = { exerciseId: "ex1", title: "Klassenfest", content: teil3, guide, completed: false, marking: false, onMarkCompleted: vi.fn() };

describe("DtzOralPractice", () => {
    it("opens the Redemittel & Tipps drawer with the DTZ guide, including en/fa hints", () => {
        render(<DtzOralPractice {...props} />);
        fireEvent.click(screen.getByRole("button", { name: /Redemittel & Tipps/ }));
        const dialog = screen.getByRole("dialog", { name: "Sprechhilfe" });
        expect(dialog.textContent).toContain("Nennen Sie einen Grund.");
        expect(screen.getByText("دلیل بیاورید.").getAttribute("dir")).toBe("rtl");
        fireEvent.click(screen.getByRole("tab", { name: /Redemittel/ }));
        expect(dialog.textContent).toContain("Wie wäre es, wenn wir ...?");
        expect(dialog.querySelector('a[href*="exam=DTZ"]')).not.toBeNull();
    });

    it("shows the possible solution at the bottom on request, like the Telc Beispielantwort", () => {
        render(<DtzOralPractice {...props} />);
        expect(screen.queryByText("Redemittel (optional)")).toBeNull();
        expect(screen.queryByRole("list", { name: "Beispielgespräch" })).toBeNull();
        const toggle = screen.getByRole("button", { name: "Beispielantwort anzeigen" });
        const finish = screen.getByRole("button", { name: /Übung beenden/ });
        // it sits below the finish card
        expect(finish.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        fireEvent.click(toggle);
        expect(screen.getByRole("list", { name: "Beispielgespräch" })).toBeTruthy();
        expect(screen.getByText(/nur ein Beispielgespräch/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Beispielantwort verbergen" }));
        expect(screen.queryByRole("list", { name: "Beispielgespräch" })).toBeNull();
    });

    it("hides help and the possible solution in the exam mode until the attempt is finished", () => {
        render(<DtzOralPractice {...props} />);
        fireEvent.click(screen.getByRole("button", { name: "Prüfung" }));
        expect(screen.queryByRole("button", { name: /Beispielantwort/ })).toBeNull();
        expect(screen.queryByRole("button", { name: /Redemittel & Tipps/ })).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        expect(screen.getByRole("button", { name: "Beispielantwort anzeigen" })).toBeTruthy();
        expect(screen.getByRole("button", { name: /Redemittel & Tipps/ })).toBeTruthy();
    });

    it("counts the tapped planning points on the finish card and resets them when the exercise is repeated", () => {
        render(<DtzOralPractice {...props} />);
        expect(screen.getByText(/0 von 4 besprochen/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Wann\?/ }));
        expect(screen.getByText(/1 von 4 besprochen/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        fireEvent.click(screen.getByRole("button", { name: /Übung wiederholen/ }));
        expect(screen.getByText(/0 von 4 besprochen/)).toBeTruthy();
    });

    it("ends with the guide's self-assessment and marks the exercise as done", () => {
        const onFinish = vi.fn();
        const onMarkCompleted = vi.fn();
        render(<DtzOralPractice {...props} onFinish={onFinish} onMarkCompleted={onMarkCompleted} />);
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        expect(onFinish).toHaveBeenCalled();
        fireEvent.click(screen.getByLabelText("Ich habe Vorschläge gemacht."));
        fireEvent.click(screen.getByRole("button", { name: /erledigt markieren/ }));
        expect(onMarkCompleted).toHaveBeenCalled();
    });
});
