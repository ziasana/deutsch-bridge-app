// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SpeakingExercise from "./SpeakingExercise";
import { SpeakingContent, SpeakingGuideContent } from "@/types/exam";

vi.mock("@/lib/backendOrigin", () => ({ resolveUploadUrl: (u: string | null) => u }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

const opinion: SpeakingContent = {
    taskType: "OPINION_DISCUSSION",
    topic: "Gruppenreisen",
    person: { name: "Sabine Klostermann", age: 33, occupation: "Bürokauffrau" },
    opinionText: "Ich reise sehr gern in einer Gruppe.",
    preparationNotes: ["Überlegen Sie, ob Sie schon einmal in einer Gruppe gereist sind."],
    exampleResponse: "Sabine reist gern in der Gruppe. Ich plane lieber selbst.",
    selfAssessment: [],
};

const opinionGuide: SpeakingGuideContent = {
    intro: "Einführung",
    tips: [{ title: "Begründen", text: "Nennen Sie einen Grund." }],
    steps: [],
    commonMistakes: [],
    selfAssessment: ["Ich habe meine Meinung begründet.", "Ich habe auf meinen Partner reagiert."],
    goals: [
        { id: "REPORT_OPINION", title: "Die Meinung der Person wiedergeben", description: "Berichten Sie, was Sabine denkt.", usefulPhrases: ["Sabine findet, dass ..."], tip: "Dritte Person!" },
        { id: "EXPRESS_OWN_OPINION", title: "Die eigene Meinung sagen", description: "Sagen Sie Ihre Meinung.", usefulPhrases: ["Meiner Meinung nach ..."] },
    ],
};

const planning: SpeakingContent = {
    taskType: "JOINT_PLANNING",
    topic: "Abschiedsparty",
    scenario: "Sie möchten eine Abschiedsparty organisieren.",
    planningPoints: [
        { id: "point_1", title: "Wann?" },
        { id: "point_2", title: "Wo?" },
    ],
    extraPhrases: ["Wer bringt den Kuchen mit?"],
    exampleDialogue: [
        { speaker: "A", text: "Wann feiern wir?" },
        { speaker: "B", text: "Am Donnerstag." },
    ],
    selfAssessment: [],
};

const planningGuide: SpeakingGuideContent = {
    intro: "x",
    tips: [],
    steps: [],
    commonMistakes: [],
    selfAssessment: ["Wir haben uns geeinigt."],
    functions: [{ function: "SUGGEST", title: "Vorschläge machen", usefulPhrases: ["Wie wäre es, wenn wir ...?"] }],
};

const interview: SpeakingContent = {
    taskType: "TOPIC_INTERVIEW",
    topic: "Sich kennenlernen",
    exampleProfile: "Elena, 29, Krankenschwester",
    topics: [{ id: "name", title: "Name", exampleAnswers: ["Ich heiße Elena."] }],
    selfAssessment: [],
};

const interviewGuide: SpeakingGuideContent = {
    intro: "x",
    tips: [],
    steps: [],
    commonMistakes: [],
    selfAssessment: ["Ich habe mich vorgestellt."],
    topics: [{ id: "name", title: "Name", questions: ["Wie heißen Sie?"], followUpQuestions: ["Haben Sie einen Spitznamen?"], usefulPhrases: ["Mein Name ist ..."], tip: "Buchstabieren üben." }],
};

function renderExercise(content: SpeakingContent, guide: SpeakingGuideContent | null = null, extra: Partial<React.ComponentProps<typeof SpeakingExercise>> = {}) {
    const onMarkCompleted = vi.fn();
    render(<SpeakingExercise exerciseId="ex-1" content={content} guide={guide} level="B1" completed={false} marking={false} onMarkCompleted={onMarkCompleted} {...extra} />);
    return { onMarkCompleted };
}


const openHelp = () => fireEvent.click(screen.getByRole("button", { name: /Redemittel & Tipps/ }));
const helpTab = (name: RegExp) => fireEvent.click(screen.getByRole("tab", { name }));

describe("SpeakingExercise", () => {
    beforeEach(() => localStorage.clear());
    afterEach(cleanup);

    it("shows the task, the person and the numbered goals for Teil 2", () => {
        renderExercise(opinion, opinionGuide);
        expect(screen.getByText("Sabine Klostermann, 33 Jahre, Bürokauffrau")).toBeTruthy();
        expect(screen.getByText("Ich reise sehr gern in einer Gruppe.")).toBeTruthy();
        expect(screen.getByText("Berichten Sie, was Sabine denkt.")).toBeTruthy();
    });

    it("shows the planning points of Teil 3 and the topics of Teil 1", () => {
        renderExercise(planning, planningGuide);
        expect(screen.getByText("Wann?")).toBeTruthy();
        expect(screen.getByText("Sie möchten eine Abschiedsparty organisieren.")).toBeTruthy();
        cleanup();
        renderExercise(interview, interviewGuide);
        expect(screen.getAllByText("Name").length).toBeGreaterThan(0);
    });

    it("opens in Lernen with a visible help button; the drawer is closed until requested and offers tips, Redemittel and typical mistakes", () => {
        renderExercise(opinion, opinionGuide);
        expect(screen.getByRole("button", { name: "Lernen" }).getAttribute("aria-pressed")).toBe("true");
        expect(screen.queryByRole("dialog")).toBeNull();
        openHelp();
        const dialog = screen.getByRole("dialog", { name: "Sprechhilfe" });
        expect(dialog).toBeTruthy();
        expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["💡 Tipps", "💬 Redemittel", "⚠️ Häufige Fehler"]);
        expect(screen.getByText(/Überlegen Sie, ob Sie schon einmal/)).toBeTruthy();
        helpTab(/Redemittel/);
        expect(screen.getByText("Sabine findet, dass ...")).toBeTruthy();
    });

    it("offers exactly two modes, Lernen and Prüfung, and no Üben", () => {
        renderExercise(opinion, opinionGuide);
        const group = screen.getByRole("group", { name: "Übungsmodus" });
        expect(Array.from(group.querySelectorAll("button")).map((b) => b.textContent)).toEqual(["Lernen", "Prüfung"]);
        expect(screen.queryByRole("button", { name: "Üben" })).toBeNull();
    });

    it("shows a prominent help button above the task in Lernen and hides it in Prüfung until finished", () => {
        renderExercise(opinion, opinionGuide);
        const help = screen.getByRole("button", { name: /Redemittel & Tipps/ });
        expect(help.textContent).toContain("Fragen, Wendungen und Hinweise");
        expect(help.compareDocumentPosition(screen.getByText("Ich reise sehr gern in einer Gruppe.")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Prüfung" }));
        expect(screen.queryByRole("button", { name: /Redemittel & Tipps/ })).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        expect(screen.getByRole("button", { name: /Redemittel & Tipps/ })).toBeTruthy();
    });

    it("shows the example answer at the bottom only after the button is clicked, and hides it again", () => {
        renderExercise(opinion, opinionGuide);
        expect(screen.queryByText(/Ich plane lieber selbst/)).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Beispielantwort anzeigen" }));
        expect(screen.getByText(/Ich plane lieber selbst/)).toBeTruthy();
        const section = screen.getAllByRole("region", { name: "Beispielantwort" })[0];
        expect(section.compareDocumentPosition(screen.getByRole("button", { name: /Übung beenden/ })) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy(); // after the finish button
        fireEvent.click(screen.getByRole("button", { name: "Beispielantwort verbergen" }));
        expect(screen.queryByText(/Ich plane lieber selbst/)).toBeNull();
    });

    it("shows the example dialogue (Teil 3) and the profile answers (Teil 1) the same way", () => {
        renderExercise(planning, planningGuide);
        fireEvent.click(screen.getByRole("button", { name: "Beispielantwort anzeigen" }));
        expect(screen.getByText("Am Donnerstag.")).toBeTruthy();
        cleanup();
        renderExercise(interview, interviewGuide);
        fireEvent.click(screen.getByRole("button", { name: "Beispielantwort anzeigen" }));
        expect(screen.getByText("Ich heiße Elena.")).toBeTruthy();
        expect(screen.getByText("Elena, 29, Krankenschwester")).toBeTruthy();
    });

    it("offers no example button for an exercise without an example", () => {
        renderExercise({ ...opinion, exampleResponse: null }, opinionGuide);
        expect(screen.queryByRole("button", { name: /Beispielantwort/ })).toBeNull();
    });

    it("hides the example in the exam mode until the attempt is finished, and closes it on repeat", () => {
        renderExercise(opinion, opinionGuide);
        fireEvent.click(screen.getByRole("button", { name: "Prüfung" }));
        expect(screen.queryByRole("button", { name: /Beispielantwort/ })).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        fireEvent.click(screen.getByRole("button", { name: "Beispielantwort anzeigen" }));
        expect(screen.getByText(/Ich plane lieber selbst/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Übung wiederholen/ }));
        expect(screen.queryByText(/Ich plane lieber selbst/)).toBeNull();
    });

    it("opens beside the exercise without leaving the page, closes with Escape and keeps the attempt", () => {
        renderExercise(opinion, opinionGuide);
        openHelp();
        expect(screen.getByText("Ich reise sehr gern in einer Gruppe.")).toBeTruthy(); // the task stays on screen behind the drawer
        expect(screen.queryAllByRole("link").filter((a) => (a.getAttribute("href") ?? "").includes("#"))).toHaveLength(0);
        fireEvent.keyDown(window, { key: "Escape" });
        expect(screen.queryByRole("dialog")).toBeNull();
        expect(screen.getByRole("button", { name: /Übung beenden/ })).toBeTruthy();
    });

    it("exam simulation hides aids and the example but keeps the task", () => {
        renderExercise(opinion, opinionGuide);
        fireEvent.click(screen.getByRole("button", { name: "Prüfung" }));
        expect(screen.queryByRole("button", { name: /Redemittel & Tipps/ })).toBeNull();
        expect(screen.queryByRole("dialog")).toBeNull();
        expect(screen.getByText("Ich reise sehr gern in einer Gruppe.")).toBeTruthy();
        expect(screen.getByText(/im Prüfungsmodus ausgeblendet/)).toBeTruthy();
    });

    it("finishing the exam simulation releases the help", () => {
        renderExercise(opinion, opinionGuide);
        fireEvent.click(screen.getByRole("button", { name: "Prüfung" }));
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        openHelp();
        expect(screen.getAllByRole("tab").map((t) => t.textContent)).toContain("⚠️ Häufige Fehler");
        expect(screen.getByText("Durchgang abgeschlossen")).toBeTruthy();
    });

    it("review shows the self-assessment checklist without any score", () => {
        renderExercise(opinion, opinionGuide);
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        expect(screen.getByText("Ich habe meine Meinung begründet.")).toBeTruthy();
        expect(screen.queryByText(/Punkte:|Ergebnis|%/)).toBeNull();
    });

    it("keeps the checklist across a reload and clears it when the exercise is repeated", () => {
        renderExercise(opinion, opinionGuide);
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        const boxes = screen.getAllByRole("checkbox");
        fireEvent.click(boxes[0]);
        expect((screen.getAllByRole("checkbox")[0] as HTMLInputElement).checked).toBe(true);

        cleanup();
        renderExercise(opinion, opinionGuide);
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        expect((screen.getAllByRole("checkbox")[0] as HTMLInputElement).checked).toBe(true);

        fireEvent.click(screen.getByRole("button", { name: /Übung wiederholen/ }));
        expect(screen.getByRole("button", { name: /Übung beenden/ })).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        expect((screen.getAllByRole("checkbox")[0] as HTMLInputElement).checked).toBe(false);
    });

    it("marks the exercise as done only through the explicit action, and shows the stored state", () => {
        const { onMarkCompleted } = renderExercise(planning, planningGuide);
        expect(screen.queryByText("Selbst als erledigt eingeschätzt")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        expect(onMarkCompleted).not.toHaveBeenCalled(); // reaching the review is not a stored completion
        fireEvent.click(screen.getByRole("button", { name: /als erledigt markieren/ }));
        expect(onMarkCompleted).toHaveBeenCalledTimes(1);
    });

    it("shows an already completed exercise as self-assessed and disables the button", () => {
        renderExercise(planning, planningGuide, { completed: true });
        expect(screen.getByText("Selbst als erledigt eingeschätzt")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        expect((screen.getByRole("button", { name: /Als erledigt markiert/ }) as HTMLButtonElement).disabled).toBe(true);
    });

    it("works when browser storage is unavailable", () => {
        const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("blocked");
        });
        const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("blocked");
        });
        renderExercise(interview, interviewGuide);
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        fireEvent.click(screen.getAllByRole("checkbox")[0]);
        expect((screen.getAllByRole("checkbox")[0] as HTMLInputElement).checked).toBe(true);
        getItem.mockRestore();
        setItem.mockRestore();
    });


    it("keeps one link to the full Lernbereich in the drawer footer", () => {
        renderExercise(opinion, opinionGuide);
        openHelp();
        expect(screen.getByRole("link", { name: /Zum Lernbereich/ }).getAttribute("href")).toBe("/dashboard/exam-prep/sprechen/lernen?level=B1&part=2");
    });

    it("shows the exercise's own phrases and the shared function phrases in Teil 3", () => {
        renderExercise(planning, planningGuide);
        openHelp();
        helpTab(/Redemittel/);
        expect(screen.getByText("Wer bringt den Kuchen mit?")).toBeTruthy();
        expect(screen.getByText("Wie wäre es, wenn wir ...?")).toBeTruthy();
    });

    it("shows the questions and phrases of the exercise's topics in Teil 1 and the persona with the examples", () => {
        renderExercise(interview, interviewGuide);
        openHelp();
        helpTab(/Redemittel/);
        fireEvent.click(screen.getByText("Name", { selector: "summary" }));
        expect(screen.getByText("Wie heißen Sie?")).toBeTruthy();
        expect(screen.getByText("Mein Name ist ...")).toBeTruthy();
    });

    it("takes the checklist from the Lernbereich unless the exercise brings its own", () => {
        renderExercise(opinion, opinionGuide);
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        expect(screen.getByText("Ich habe auf meinen Partner reagiert.")).toBeTruthy();
        cleanup();
        renderExercise({ ...opinion, selfAssessment: ["Eigener Punkt"] }, opinionGuide);
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        expect(screen.getByText("Eigener Punkt")).toBeTruthy();
        expect(screen.queryByText("Ich habe auf meinen Partner reagiert.")).toBeNull();
    });

    it("still works while the Lernbereich is loading or missing", () => {
        renderExercise(opinion, null);
        expect(screen.getByText("Ich reise sehr gern in einer Gruppe.")).toBeTruthy();
        openHelp();
        expect(screen.getByText(/Lernbereich ist gerade nicht verfügbar/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Schließen" }));
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        expect(screen.getByRole("button", { name: /Übung wiederholen/ })).toBeTruthy();
    });

    it("shows the Teil 3 scene picture next to the scenario and enlarges it on click", () => {
        renderExercise({ ...planning, image: "https://example.org/party.webp", imageAlt: "Freunde essen im Garten" }, planningGuide);
        const picture = screen.getByRole("img", { name: "Freunde essen im Garten" });
        expect(picture.getAttribute("src")).toBe("https://example.org/party.webp");
        expect(screen.queryByRole("dialog", { name: "Bild vergrößert" })).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Bild vergrößern" }));
        expect(screen.getByRole("dialog", { name: "Bild vergrößert" })).toBeTruthy();
        fireEvent.keyDown(window, { key: "Escape" });
        expect(screen.queryByRole("dialog", { name: "Bild vergrößert" })).toBeNull();
    });

    it("falls back to an illustration when Teil 3 has no picture, and when the picture cannot be loaded", () => {
        renderExercise(planning, planningGuide);
        expect(screen.queryByRole("img")).toBeNull();
        expect(screen.queryByRole("button", { name: "Bild vergrößern" })).toBeNull();
        cleanup();
        renderExercise({ ...planning, image: "https://example.org/broken.webp", imageAlt: "kaputt" }, planningGuide);
        fireEvent.error(screen.getByRole("img", { name: "kaputt" }));
        expect(screen.queryByRole("img")).toBeNull();
    });

    it("lets the learner tick off planning points, shows the progress and clears it on repeat", () => {
        renderExercise(planning, planningGuide);
        const bar = () => screen.getByRole("progressbar", { name: "Geklärte Planungspunkte" });
        expect(bar().getAttribute("aria-valuenow")).toBe("0");
        fireEvent.click(screen.getByRole("button", { name: /Wann\?/ }));
        expect(bar().getAttribute("aria-valuenow")).toBe("1");
        fireEvent.click(screen.getByRole("button", { name: /Wo\?/ }));
        expect(screen.getByRole("status").textContent).toContain("Alles geplant");
        fireEvent.click(screen.getByRole("button", { name: /Wann\?/ }));
        expect(bar().getAttribute("aria-valuenow")).toBe("1");
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        fireEvent.click(screen.getByRole("button", { name: /Übung wiederholen/ }));
        expect(bar().getAttribute("aria-valuenow")).toBe("0");
    });

    it("tracks the covered topics (Teil 1) and tasks (Teil 2)", () => {
        renderExercise(interview, interviewGuide);
        fireEvent.click(screen.getByRole("button", { name: /Name/ }));
        expect(screen.getByRole("progressbar", { name: "Besprochene Themen" }).getAttribute("aria-valuenow")).toBe("1");
        cleanup();
        renderExercise(opinion, opinionGuide);
        fireEvent.click(screen.getByRole("button", { name: /Berichten Sie, was Sabine denkt/ }));
        expect(screen.getByRole("progressbar", { name: "Erledigte Aufgaben" }).getAttribute("aria-valuenow")).toBe("1");
    });

    it("hands the timer over to the page: onFinish when ending, onRepeat when repeating, and shows the Zeit-Check in the review", () => {
        const onFinish = vi.fn();
        const onRepeat = vi.fn();
        const timeResult = { id: "s1", scope: "EXERCISE", mode: "TIME_TRAINING", section: "MUENDLICHER_AUSDRUCK", level: "B1", teil: 3, elapsedSeconds: 250, targetSeconds: 300, differenceSeconds: -50, questionsTotal: 0, questionsAnswered: 0, correctAnswers: 0, score: null } as const;
        renderExercise(planning, planningGuide, { onFinish, onRepeat, timeResult });
        expect(screen.queryByText(/Deine Zeit/)).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: /Übung beenden/ }));
        expect(onFinish).toHaveBeenCalledTimes(1);
        expect(screen.getByText(/Deine Zeit: 04:10/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Übung wiederholen/ }));
        expect(onRepeat).toHaveBeenCalledTimes(1);
    });
});
