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
});
