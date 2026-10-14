import { describe, expect, it } from "vitest";
import { draftFromStored, emptyDraft, localProblems, parseDialogue, toBody, toImportJson } from "./dtzOralForm";

describe("DTZ oral form mapping", () => {
    it("builds the Teil 2 import shape with the fixed examiner texts", () => {
        const draft = emptyDraft(2);
        draft.title = "Einkaufen im Internet";
        draft.t2 = { topic: "Einkaufen", imageUrl: null, imagePrompt: "A photo", altText: "", questionsA2: ["a", "b", "c", "d"], questionsB1: ["e", "f", "g", "h"], solutionDescription: "Ich sehe eine Frau.", solutionA2: "", solutionB1: "Ich kaufe online." };
        const body = toBody(draft) as any;
        expect(body.participantA.instructions).toMatch(/^Sie haben in einer Zeitschrift ein Foto gefunden/);
        expect(body.participantA.questions).toHaveLength(2);
        expect(body.participantB.instructions).toBe("Erzählen Sie bitte: Welche Erfahrungen haben Sie damit?");
        expect(body.image).toEqual({ imageUrl: null, imagePrompt: "A photo", altText: null });
        expect(body.possibleSolution).toEqual({ description: "Ich sehe eine Frau.", experienceA2: null, experienceB1: "Ich kaufe online." });
        expect(toImportJson(draft)).toMatchObject({ exam: "DTZ", section: "MUENDLICH", exerciseType: "PHOTO_EXPERIENCE", part: 2 });
    });

    it("round-trips a stored exercise", () => {
        const stored = { dtzOral: { part: 3, languageLevel: "B1", topic: "Umzug", situation: "Sie beide ziehen um.", planningNotes: [{ number: 1, label: "Wann?" }, { number: 2, label: "Wer hilft?" }, { number: 3, label: "Transporter?" }, { number: 4, label: "Essen?" }], learnerSupport: { examplePhrases: ["Ich schlage vor ..."] } } };
        const body = toBody(draftFromStored(3, "Umzug", stored)) as any;
        expect(body).toMatchObject({ part: 3, title: "Umzug", level: "B1", topic: "Umzug", taskInstruction: "Planen Sie gemeinsam, was Sie tun wollen." });
        expect(body.planningNotes.map((n: any) => n.label)).toEqual(["Wann?", "Wer hilft?", "Transporter?", "Essen?"]);
        expect(body.learnerSupport.examplePhrases).toEqual(["Ich schlage vor ..."]);
    });

    it("always writes the six fixed Teil 1 topics and only keeps practice support that was filled in", () => {
        const draft = emptyDraft(1);
        draft.t1.practice[2].sentenceStarter = "Ich wohne in ...";
        draft.t1.practice[2].vocabularyText = "die Wohnung\n\n das Haus ";
        const body = toBody(draft) as any;
        expect(body.topics.map((t: any) => t.label)).toEqual(["Name", "Geburtsort", "Wohnort", "Arbeit/Beruf", "Familie", "Sprachen"]);
        expect(body.practiceSupport).toEqual([{ topicNumber: 3, question: null, sentenceStarter: "Ich wohne in ...", vocabulary: ["die Wohnung", "das Haus"] }]);
    });

    it("reports what is missing before saving", () => {
        const draft = emptyDraft(3);
        expect(localProblems(draft)).toEqual(expect.arrayContaining(["The title must not be empty.", "The situation must not be empty.", "No planning note may be empty."]));
        expect(localProblems(emptyDraft(1))).toEqual([]);
    });

    it("turns the possible-solution lines of Teil 3 into dialogue turns and back", () => {
        expect(parseDialogue("A: Wann feiern wir?\nb - Am Freitag.\nund zwar abends\nA：Gut.")).toEqual({
            turns: [{ speaker: "A", text: "Wann feiern wir?" }, { speaker: "B", text: "Am Freitag. und zwar abends" }, { speaker: "A", text: "Gut." }],
            invalid: 0,
        });
        expect(parseDialogue("Hallo ohne Sprecher").invalid).toBe(1);
        const draft = emptyDraft(3);
        draft.t3.solutionText = "A: Wann?\nB: Freitag.\nA: Wo?\nB: Im Kursraum.";
        const body = toBody(draft) as any;
        expect(body.possibleSolution.dialogue).toHaveLength(4);
        const back = draftFromStored(3, "x", { dialogue: undefined, dtzOral: { part: 3, planningNotes: [], possibleSolution: body.possibleSolution } });
        expect(back.t3.solutionText).toBe("A: Wann?\nB: Freitag.\nA: Wo?\nB: Im Kursraum.");
    });

    it("checks the possible solution of Teil 3 before saving", () => {
        const draft = emptyDraft(3);
        draft.title = "t";
        draft.t3 = { topic: "t", situation: "s", notes: ["a?", "b?", "c?", "d?"], phrasesText: "", solutionText: "A: Hallo\nB: Hi" };
        expect(localProblems(draft)).toContain("The possible solution needs 4 to 20 turns.");
        draft.t3.solutionText = "irgendein Text";
        expect(localProblems(draft)).toContain("Every line of the possible solution must start with A: or B:.");
        draft.t3.solutionText = "";
        expect(localProblems(draft)).toEqual([]);
    });
});
