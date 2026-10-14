// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DtzOralTeil1, DtzOralTeil2, DtzOralTeil3 } from "@/types/dtzOral";
import DtzOralExercise from "./DtzOralExercise";

vi.mock("@/lib/backendOrigin", async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    resolveUploadUrl: (url: string | null) => (url ? `http://backend${url}` : null),
}));

afterEach(cleanup);

const teil1: DtzOralTeil1 = {
    part: 1,
    instructions: "Stellen Sie sich vor. Sprechen Sie über die folgenden Themen:",
    guidance: "Ein bis zwei Sätze pro Thema.",
    topics: ["Name", "Geburtsort", "Wohnort", "Arbeit/Beruf", "Familie", "Sprachen"].map((label, i) => ({ number: i + 1, label })),
    practiceSupport: [{ topicNumber: 3, question: "Wo wohnen Sie?", sentenceStarter: "Ich wohne in ...", vocabulary: ["die Wohnung", "das Haus"], explanation: { en: "Say where you live.", fa: "بگویید کجا زندگی می‌کنید." } }],
};

const teil2: DtzOralTeil2 = {
    part: 2,
    topic: "Einkaufen",
    image: { imageUrl: "/uploads/exam-passages/abc.webp", imagePrompt: "SECRET PROMPT", altText: "Eine Frau kauft online ein." },
    participantA: { title: "Bildbeschreibung", instructions: "Sie haben in einer Zeitschrift ein Foto gefunden. Berichten Sie kurz:", questions: ["Was sehen Sie auf dem Foto?", "Was für eine Situation zeigt dieses Bild?"] },
    participantB: {
        title: "Eigene Erfahrungen",
        instructions: "Erzählen Sie bitte: Welche Erfahrungen haben Sie damit?",
        questionsA2: ["A2 eins?", "A2 zwei?", "A2 drei?", "A2 vier?"],
        questionsB1: ["B1 eins?", "B1 zwei?", "B1 drei?", "B1 vier?"],
    },
    possibleSolution: { description: "Ich sehe eine Frau am Laptop.", experienceA2: "Ich kaufe manchmal online.", experienceB1: "Ich kaufe online, weil es bequem ist." },
};

const teil3: DtzOralTeil3 = {
    part: 3,
    topic: "Klassenfest",
    situation: "Ihr Kurs feiert ein Fest. Sie beide organisieren das Klassenfest.",
    taskInstruction: "Planen Sie gemeinsam, was Sie tun wollen.",
    planningNotes: ["Wann?", "Wo feiern?", "Essen und Trinken?", "Musik?"].map((label, i) => ({ number: i + 1, label })),
    learnerSupport: { examplePhrases: ["Ich schlage vor, dass ..."] },
    possibleSolution: { dialogue: [{ speaker: "A", text: "Wann feiern wir?" }, { speaker: "B", text: "Am Freitag." }, { speaker: "A", text: "Wo?" }, { speaker: "B", text: "Im Kursraum." }] },
};

describe("Teil 1 learner view", () => {
    it("shows the six topics in order", () => {
        render(<DtzOralExercise title="Über sich sprechen" content={teil1} />);
        const items = within(screen.getByRole("region", { name: "Prüfungsaufgabe" })).getAllByRole("listitem").map((li) => li.textContent ?? "");
        ["Name", "Geburtsort", "Wohnort", "Arbeit/Beruf", "Familie", "Sprachen"].forEach((label, i) => expect(items[i]).toContain(label));
        expect(items).toHaveLength(6);
    });

    it("lets the learner tap a topic as talked about and counts the progress", () => {
        render(<DtzOralExercise title="Über sich sprechen" content={teil1} />);
        const task = screen.getByRole("region", { name: "Prüfungsaufgabe" });
        expect(within(task).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
        fireEvent.click(within(task).getByRole("button", { name: /Wohnort/ }));
        expect(within(task).getByRole("button", { name: /Wohnort/ }).getAttribute("aria-pressed")).toBe("true");
        expect(within(task).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1");
    });

    it("uses the ticks of the practice page when it owns them", () => {
        const onToggle = vi.fn();
        render(<DtzOralExercise title="Über sich sprechen" content={teil1} covered={["topic-1"]} onToggle={onToggle} />);
        const task = screen.getByRole("region", { name: "Prüfungsaufgabe" });
        expect(within(task).getByRole("button", { name: /Name/ }).getAttribute("aria-pressed")).toBe("true");
        fireEvent.click(within(task).getByRole("button", { name: /Familie/ }));
        expect(onToggle).toHaveBeenCalledWith("topic-5");
    });

    it("keeps practice support separate, optional and marked as not mandatory", () => {
        render(<DtzOralExercise title="Über sich sprechen" content={teil1} />);
        const support = screen.getByRole("region", { name: "Übungshilfe" });
        expect(within(support).getByText(/nicht zur Prüfungsaufgabe/)).toBeTruthy();
        expect(within(support).getByText("Satzanfang (Beispiel):")).toBeTruthy();
        expect(within(support).getByText("Ich wohne in ...")).toBeTruthy();
        expect(within(support).getByText("die Wohnung")).toBeTruthy();
        expect(screen.getByText("بگویید کجا زندگی می‌کنید.").getAttribute("dir")).toBe("rtl");
        // The topic list itself holds no sample sentence.
        expect(within(screen.getByRole("region", { name: "Prüfungsaufgabe" })).queryByText("Ich wohne in ...")).toBeNull();
    });
});

describe("Teil 2 learner view", () => {
    it("shows the photo, participant A's prompts and participant B's instruction", () => {
        render(<DtzOralExercise title="Einkaufen" content={teil2} />);
        expect((screen.getByAltText("Eine Frau kauft online ein.") as HTMLImageElement).src).toBe("http://backend/uploads/exam-passages/abc.webp");
        const a = screen.getByRole("region", { name: "Teilnehmer A" });
        expect(within(a).getByText(/Sie haben in einer Zeitschrift ein Foto gefunden/)).toBeTruthy();
        expect(within(a).getAllByRole("listitem")).toHaveLength(2);
        expect(within(a).getByRole("button", { name: /Was sehen Sie auf dem Foto\?/ })).toBeTruthy();
        expect(within(screen.getByRole("region", { name: "Teilnehmer B" })).getByText("Erzählen Sie bitte: Welche Erfahrungen haben Sie damit?")).toBeTruthy();
    });

    it("switches between A2, B1 and mixed practice with the same photo", () => {
        render(<DtzOralExercise title="Einkaufen" content={teil2} />);
        const b = screen.getByRole("region", { name: "Teilnehmer B" });
        const texts = () => within(b).getAllByRole("listitem").map((li) => li.textContent ?? "");
        expect(texts()).toHaveLength(4);
        ["A2 eins?", "A2 zwei?", "A2 drei?", "A2 vier?"].forEach((q, i) => expect(texts()[i]).toContain(q));
        fireEvent.click(screen.getByRole("radio", { name: "B1" }));
        ["B1 eins?", "B1 zwei?", "B1 drei?", "B1 vier?"].forEach((q, i) => expect(texts()[i]).toContain(q));
        fireEvent.click(screen.getByRole("radio", { name: "Gemischt" }));
        expect(texts()).toHaveLength(8);
        ["A2 eins?", "B1 eins?", "A2 zwei?", "B1 zwei?"].forEach((q, i) => expect(texts()[i]).toContain(q));
        expect(screen.getByAltText("Eine Frau kauft online ein.")).toBeTruthy();
    });

    it("never shows the image prompt to a learner, but shows it in the admin preview", () => {
        const { unmount } = render(<DtzOralExercise title="Einkaufen" content={teil2} />);
        expect(screen.queryByText(/SECRET PROMPT/)).toBeNull();
        unmount();
        render(<DtzOralExercise title="Einkaufen" content={teil2} adminImagePrompt="SECRET PROMPT" />);
        expect(screen.getByText(/SECRET PROMPT/)).toBeTruthy();
    });

    it("shows an empty frame, not a broken picture, when no photo is attached", () => {
        render(<DtzOralExercise title="Einkaufen" content={{ ...teil2, image: { imageUrl: null, altText: null } }} />);
        expect(screen.queryByRole("img", { name: /Foto zur Aufgabe/ })).toBeNull();
        expect(screen.getByRole("img", { name: "Kein Foto" })).toBeTruthy();
    });
});

describe("Teil 2 mögliche Lösung", () => {
    it("offers a collapsed possible solution that follows the practice mode and says it is only one possibility", () => {
        render(<DtzOralExercise title="Einkaufen" content={teil2} />);
        const details = screen.getByText("Mögliche Lösung").closest("details") as HTMLDetailsElement;
        expect(details.open).toBe(false);
        expect(screen.getByText(/nur eine mögliche Antwort/)).toBeTruthy();
        expect(screen.getByText("Ich sehe eine Frau am Laptop.")).toBeTruthy();
        expect(screen.getByText("Ich kaufe manchmal online.")).toBeTruthy();
        expect(screen.queryByText("Ich kaufe online, weil es bequem ist.")).toBeNull();
        fireEvent.click(screen.getByRole("radio", { name: "B1" }));
        expect(screen.getByText("Ich kaufe online, weil es bequem ist.")).toBeTruthy();
        expect(screen.queryByText("Ich kaufe manchmal online.")).toBeNull();
        fireEvent.click(screen.getByRole("radio", { name: "Gemischt" }));
        expect(screen.getByText("Ich kaufe manchmal online.")).toBeTruthy();
        expect(screen.getByText("Ich kaufe online, weil es bequem ist.")).toBeTruthy();
    });

    it("shows no solution block when the exercise has none", () => {
        render(<DtzOralExercise title="Einkaufen" content={{ ...teil2, possibleSolution: null }} />);
        expect(screen.queryByText("Mögliche Lösung")).toBeNull();
    });
});

describe("Teil 3 learner view", () => {
    it("shows the situation, the instruction and the planning notes without any decision", () => {
        render(<DtzOralExercise title="Klassenfest" content={teil3} />);
        expect(screen.getByText("Planen Sie gemeinsam, was Sie tun wollen.")).toBeTruthy();
        const notes = within(screen.getByRole("region", { name: "Notizen zur Planung" })).getAllByRole("listitem").map((li) => li.textContent ?? "");
        ["Wann?", "Wo feiern?", "Essen und Trinken?", "Musik?"].forEach((label, i) => expect(notes[i]).toContain(label));
        expect(notes).toHaveLength(4);
        expect(screen.queryByText("Redemittel (optional)")).toBeNull();
    });
});

describe("Teil 3 mögliche Lösung", () => {
    it("offers a collapsed sample conversation that is marked as only one possibility", () => {
        render(<DtzOralExercise title="Klassenfest" content={teil3} />);
        const details = screen.getByText("Mögliche Lösung").closest("details") as HTMLDetailsElement;
        expect(details.open).toBe(false);
        expect(screen.getByText(/nur ein mögliches Gespräch/)).toBeTruthy();
        const turns = within(screen.getByRole("list", { name: "Mögliches Gespräch" })).getAllByRole("listitem").map((li) => li.textContent);
        expect(turns).toEqual(["AWann feiern wir?", "BAm Freitag.", "AWo?", "BIm Kursraum."]);
        // The task itself holds no conversation.
        expect(within(screen.getByRole("region", { name: "Situation" })).queryByText("Am Freitag.")).toBeNull();
    });

    it("shows nothing when there is no solution", () => {
        render(<DtzOralExercise title="Klassenfest" content={{ ...teil3, possibleSolution: null }} />);
        expect(screen.queryByText("Mögliche Lösung")).toBeNull();
    });
});

describe("solution shown by the practice page", () => {
    it("leaves the possible solution out of the task when the page shows it at the bottom", () => {
        render(<DtzOralExercise title="Klassenfest" content={teil3} hideSolution />);
        expect(screen.queryByText("Mögliche Lösung")).toBeNull();
    });
});

describe("marking as practised", () => {
    it("offers the button only on the learner page", () => {
        const done = vi.fn();
        const { unmount } = render(<DtzOralExercise title="x" content={teil3} />);
        expect(screen.queryByRole("button", { name: /markieren/ })).toBeNull();
        unmount();
        render(<DtzOralExercise title="x" content={teil3} completed={false} onMarkCompleted={done} />);
        fireEvent.click(screen.getByRole("button", { name: /Als geübt markieren/ }));
        expect(done).toHaveBeenCalled();
    });
});
