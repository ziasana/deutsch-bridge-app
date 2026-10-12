// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SimExerciseView from "./SimExerciseView";
import type { PartState } from "@/types/examSimulation";

vi.mock("./SimAudio", () => ({ default: () => <div data-testid="sim-audio" /> }));

const listeningPart = (): PartState => ({
    key: "HOEREN_1",
    label: "Hörverstehen Teil 1",
    module: "WRITTEN",
    section: "HOERVERSTEHEN",
    teil: 1,
    maxPoints: 10,
    scoringMethod: "PER_QUESTION",
    previewOnly: false,
    maxAudioPlays: 2,
    audioPlays: {},
    exercises: [
        {
            ordinal: 0,
            title: "Durchsagen",
            taskType: "TRUE_FALSE_NOT_GIVEN",
            teilDescription: null,
            passages: [{ id: "p1", label: "Durchsage 1", content: null, audioUrl: "/a.mp3", imageUrl: null }],
            questions: [{ id: "q1", taskType: "TRUE_FALSE_NOT_GIVEN", prompt: "Der Zug hat Verspätung.", sectionIndex: 0, options: null, gapNumber: null, questionNumber: 1 }],
            answerOptions: ["+", "-"],
            answerOptionLabels: null,
            requiresPlanning: false,
            leitpunkte: null,
            speaking: null,
        },
    ],
} as unknown as PartState);

describe("SimExerciseView - Hörverstehen", () => {
    afterEach(cleanup);

    it("offers only Richtig / Falsch (no 'Nicht im Text') and answers with the Übung's + / - values", () => {
        const onAnswer = vi.fn();
        render(<SimExerciseView attemptId="a1" part={listeningPart()} answers={{}} disabled={false} onAnswer={onAnswer} />);
        expect(screen.queryByText(/nicht im text/i)).toBeNull();
        expect(screen.getByTestId("sim-audio")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Aussage 1: Falsch/ }));
        expect(onAnswer).toHaveBeenCalledWith("q1", "-", false);
    });

    it("keeps the review flag when the answer changes", () => {
        const onAnswer = vi.fn();
        render(<SimExerciseView attemptId="a1" part={listeningPart()} answers={{ q1: { answer: "+", flagged: true } }} disabled={false} onAnswer={onAnswer} />);
        fireEvent.click(screen.getByRole("button", { name: /Aussage 1: Falsch/ }));
        expect(onAnswer).toHaveBeenCalledWith("q1", "-", true);
        fireEvent.click(screen.getByRole("button", { name: /Markierung entfernen/ }));
        expect(onAnswer).toHaveBeenLastCalledWith("q1", "+", false);
    });

    it("Lesen Teil 3 uses the Übung's situation board and stores the chosen advertisement", () => {
        const onAnswer = vi.fn();
        const part = {
            key: "LESEN_3", label: "Leseverstehen Teil 3", module: "WRITTEN", section: "LESEVERSTEHEN", teil: 3, maxPoints: 10, scoringMethod: "PER_QUESTION", previewOnly: false,
            maxAudioPlays: null, audioPlays: {},
            exercises: [{
                ordinal: 0, title: "Anzeigen", taskType: "SITUATION_MATCHING", teilDescription: null,
                passages: [{ id: "a1", label: "a", content: "Fahrradverleih", audioUrl: null, imageUrl: null }, { id: "a2", label: "b", content: "Nachhilfe", audioUrl: null, imageUrl: null }],
                questions: [{ id: "s1", taskType: "SITUATION_MATCHING", prompt: "Ein Fahrrad mieten.", sectionIndex: null, options: null, gapNumber: null, questionNumber: 11 }],
                answerOptions: null, answerOptionLabels: null, requiresPlanning: false, leitpunkte: null, speaking: null,
            }],
        } as unknown as PartState;
        render(<SimExerciseView attemptId="a1" part={part} answers={{}} disabled={false} onAnswer={onAnswer} />);
        fireEvent.click(screen.getByRole("button", { name: "Anzeige a" }));
        expect(onAnswer).toHaveBeenCalledWith("s1", "a1", false);
    });

    it("Sprachbausteine Teil 2 uses the Übung's gap board with the word bank", () => {
        const onAnswer = vi.fn();
        const part = {
            key: "SPRACH_2", label: "Sprachbausteine Teil 2", module: "WRITTEN", section: "SPRACHBAUSTEINE", teil: 2, maxPoints: 10, scoringMethod: "PER_QUESTION", previewOnly: false,
            maxAudioPlays: null, audioPlays: {},
            exercises: [{
                ordinal: 0, title: "Lückentext", taskType: "WORD_BANK_CLOZE", teilDescription: null,
                passages: [{ id: "p1", label: "Text", content: '<p>Ich gehe <span data-exam-gap="21" class="exam-gap-marker">21</span> Schule.</p>', audioUrl: null, imageUrl: null }],
                questions: [{ id: "g1", taskType: "WORD_BANK_CLOZE", prompt: null, sectionIndex: null, options: null, gapNumber: 21, questionNumber: 21 }],
                answerOptions: ["in die", "auf dem"], answerOptionLabels: null, requiresPlanning: false, leitpunkte: null, speaking: null,
            }],
        } as unknown as PartState;
        render(<SimExerciseView attemptId="a1" part={part} answers={{}} disabled={false} onAnswer={onAnswer} />);
        fireEvent.click(screen.getByRole("button", { name: /in die/ }));
        expect(onAnswer).toHaveBeenCalledWith("g1", "in die", false);
    });

    const lesenPart = (taskType: string, ex: object) =>
        ({ key: "LESEN_X", label: "Leseverstehen", module: "WRITTEN", section: "LESEVERSTEHEN", teil: 1, maxPoints: 10, scoringMethod: "PER_QUESTION", previewOnly: false, maxAudioPlays: null, audioPlays: {},
            exercises: [{ ordinal: 0, title: "t", taskType, teilDescription: null, requiresPlanning: false, leitpunkte: null, speaking: null, answerOptionLabels: null, ...ex }] }) as unknown as PartState;

    it("Lesen Teil 1 uses the Übung's heading board and stores the chosen heading", () => {
        const onAnswer = vi.fn();
        const part = lesenPart("MATCHING", {
            passages: [{ id: "t1", label: "Text 1", content: "Ein Text über Reisen.", audioUrl: null, imageUrl: null }],
            questions: [{ id: "h1", taskType: "MATCHING", prompt: "Text 1", sectionIndex: 0, options: null, gapNumber: null, questionNumber: 1 }],
            answerOptions: ["Urlaub am Meer", "Neue Arbeit"],
        });
        render(<SimExerciseView attemptId="a1" part={part} answers={{}} disabled={false} onAnswer={onAnswer} />);
        fireEvent.click(screen.getAllByRole("button", { name: /Urlaub am Meer/ })[0]);
        expect(onAnswer).toHaveBeenCalledWith("h1", "Urlaub am Meer", false);
    });

    it("Lesen Teil 2 shows the text panel and one question at a time", () => {
        const onAnswer = vi.fn();
        const part = lesenPart("MULTIPLE_CHOICE", {
            passages: [{ id: "t1", label: "Text", content: "Ein langer Artikel.", audioUrl: null, imageUrl: null }],
            questions: [
                { id: "m1", taskType: "MULTIPLE_CHOICE", prompt: "Erste Frage?", sectionIndex: null, options: ["ja", "nein"], gapNumber: null, questionNumber: 6 },
                { id: "m2", taskType: "MULTIPLE_CHOICE", prompt: "Zweite Frage?", sectionIndex: null, options: ["a1", "b1"], gapNumber: null, questionNumber: 7 },
            ],
            answerOptions: null,
        });
        render(<SimExerciseView attemptId="a1" part={part} answers={{}} disabled={false} onAnswer={onAnswer} />);
        expect(screen.getByText("Erste Frage?")).toBeTruthy();
        expect(screen.queryByText("Zweite Frage?")).toBeNull();
        fireEvent.click(screen.getByRole("radio", { name: /nein/ }));
        expect(onAnswer).toHaveBeenCalledWith("m1", "nein", false);
        fireEvent.click(screen.getByRole("button", { name: /Weiter/ }));
        expect(screen.getByText("Zweite Frage?")).toBeTruthy();
    });
});
