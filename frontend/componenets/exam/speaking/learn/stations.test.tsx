// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { buildSpeakingStations } from "./stations";
import { SpeakingGuideContent } from "@/types/exam";

const base = {
    intro: "Einführung",
    tips: [
        { title: "Tipp A", text: "Text A" },
        { title: "Tipp B", text: "Text B" },
    ],
    steps: [{ title: "1. Start", text: "Los" }],
    commonMistakes: ["Fehler 1", "Fehler 2"],
    selfAssessment: ["Punkt 1", "Punkt 2", "Punkt 3", "Punkt 4", "Punkt 5", "Punkt 6"],
};

const teil1: SpeakingGuideContent = {
    ...base,
    topics: ["name", "herkunft", "wohnen", "familie"].map((id) => ({
        id,
        title: id.toUpperCase(),
        questions: [`Frage ${id}?`],
        followUpQuestions: [`Nachfrage ${id}?`],
        usefulPhrases: [`Phrase ${id} 1`, `Phrase ${id} 2`],
        tip: `Tipp ${id}`,
    })),
};

const teil2: SpeakingGuideContent = {
    ...base,
    goals: ["REPORT_OPINION", "EXPRESS_OWN_OPINION", "DESCRIBE_EXPERIENCE", "REACT_TO_PARTNER"].map((id) => ({
        id,
        title: id,
        description: "d",
        usefulPhrases: [`P ${id} 1`, `P ${id} 2`, `P ${id} 3`],
    })),
};

describe("buildSpeakingStations", () => {
    it("builds the full path for Teil 1 in learning order, including the questions station", () => {
        expect(buildSpeakingStations(teil1, 1, "B1").map((s) => s.id)).toEqual(["ablauf", "tipps", "fragen", "redemittel", "fehler", "checkliste"]);
    });

    it("has no questions station for Teil 2 and Teil 3", () => {
        expect(buildSpeakingStations(teil2, 2, "B1").map((s) => s.id)).toEqual(["ablauf", "tipps", "redemittel", "fehler", "checkliste"]);
    });

    it("skips stations without content", () => {
        const sparse: SpeakingGuideContent = { ...teil2, steps: [], tips: [], commonMistakes: [], selfAssessment: [], goals: [] };
        expect(buildSpeakingStations(sparse, 2, "B1").map((s) => s.id)).toEqual(["ablauf"]);
    });

    it("gates the quiz steps and keeps the slides free, with at most five questions per station", () => {
        const redemittel = buildSpeakingStations(teil1, 1, "B1").find((s) => s.id === "redemittel")!;
        const gated = redemittel.steps.filter((s) => s.gated);
        expect(gated.length).toBe(4); // four categories -> four quizzes
        expect(redemittel.steps.filter((s) => !s.gated).length).toBe(1 + 4); // intro + one slide per category
        expect(gated.length).toBeLessThanOrEqual(5);
    });

    it("is deterministic for the same level and Teil", () => {
        const ids = (level: string) => buildSpeakingStations(teil1, 1, level).flatMap((s) => s.steps.map((x) => x.id));
        expect(ids("B1")).toEqual(ids("B1"));
    });

    it("splits the checklist into short pages", () => {
        const checkliste = buildSpeakingStations(teil2, 2, "B1").find((s) => s.id === "checkliste")!;
        expect(checkliste.steps.length).toBe(1 + 2); // intro + 6 items in chunks of 5
    });
});
