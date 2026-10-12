// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import SimResultView from "./SimResultView";
import type { ExamResult, PartResult, ResultResponse } from "@/types/examSimulation";

const part = (over: Partial<PartResult>): PartResult => ({
    key: "LESEN_1",
    label: "Leseverstehen Teil 1",
    module: "WRITTEN",
    section: "LESEVERSTEHEN",
    teil: 1,
    method: "PER_QUESTION",
    maxPoints: 25,
    score: 15,
    status: "SCORED",
    totalQuestions: 5,
    correct: 3,
    incorrect: 1,
    unanswered: 1,
    completed: false,
    criteriaScores: null,
    assessorComment: null,
    ...over,
});

const result = (over: Partial<ExamResult> = {}): ExamResult => ({
    writtenScore: 180,
    writtenMax: 225,
    writtenPercentage: 80,
    writtenComplete: false,
    writtenPassThreshold: 135,
    writtenResult: "AWAITING_ASSESSMENT",
    oralScoringEnabled: false,
    oralScore: null,
    oralMax: 75,
    oralPassThreshold: 45,
    oralResult: "NOT_ASSESSED",
    totalScore: null,
    totalMax: 300,
    overallResult: "AWAITING_ASSESSMENT",
    overallExplanation: "WRITTEN_ASSESSMENT_PENDING",
    parts: [
        part({}),
        part({ key: "SCHRIFTLICHER_AUSDRUCK", label: "Schriftlicher Ausdruck", section: "SCHRIFTLICHER_AUSDRUCK", method: "MANUAL_RUBRIC", maxPoints: 45, score: null, status: "AWAITING_ASSESSMENT", totalQuestions: 0 }),
        part({ key: "MUENDLICH_1", label: "Mündlicher Ausdruck Teil 1", module: "ORAL", section: "MUENDLICHER_AUSDRUCK", method: "UNSCORED", maxPoints: 15, score: null, status: "NOT_SCORED", completed: true }),
    ],
    pendingAssessmentParts: ["SCHRIFTLICHER_AUSDRUCK"],
    computedAtMs: 0,
    ...over,
});

const response = (r: ExamResult, over: Partial<ResultResponse> = {}): ResultResponse => ({
    attemptId: "a1",
    status: "COMPLETED",
    finishReason: "SUBMITTED",
    profileTitle: "telc Deutsch B1",
    profileVersion: 1,
    startedAtMs: Date.UTC(2026, 0, 10, 9),
    endedAtMs: Date.UTC(2026, 0, 10, 12),
    durationSeconds: 3 * 3600,
    result: r,
    rubrics: {},
    answersReleased: false,
    answerReleasePolicy: "AFTER_ASSESSMENT",
    review: [],
    ...over,
});

describe("SimResultView", () => {
    afterEach(cleanup);

    it("shows written, oral and overall results separately and explains the missing assessment", () => {
        render(<SimResultView data={response(result())} />);
        const written = screen.getByRole("region", { name: "Schriftliche Prüfung" });
        expect(within(written).getByText("Bewertung steht noch aus")).toBeTruthy();
        expect(within(written).getByText(/Vorläufig/)).toBeTruthy();
        const oral = screen.getByRole("region", { name: "Mündliche Prüfung" });
        expect(within(oral).getByText("Nicht bewertet")).toBeTruthy();
        expect(within(oral).getByText(/1 von 1 Teilen geübt/)).toBeTruthy();
        const overall = screen.getByRole("region", { name: "Gesamtergebnis" });
        expect(within(overall).getByText(/noch nicht beurteilt/)).toBeTruthy();
        expect(screen.getByRole("status").textContent).toContain("Schriftlicher Ausdruck");
    });

    it("never claims the full exam is passed when only the written exam is: the overall result stays incomplete", () => {
        const r = result({ writtenComplete: true, writtenResult: "PASSED", writtenScore: 190, overallResult: "INCOMPLETE", overallExplanation: "ORAL_NOT_ASSESSED", pendingAssessmentParts: [] });
        render(<SimResultView data={response(r)} />);
        expect(within(screen.getByRole("region", { name: "Schriftliche Prüfung" })).getByText("Bestanden")).toBeTruthy();
        const overall = screen.getByRole("region", { name: "Gesamtergebnis" });
        expect(within(overall).getByText("Unvollständig")).toBeTruthy();
        expect(within(overall).queryByText("Bestanden")).toBeNull();
        expect(within(overall).getByText(/nur eine Übung/)).toBeTruthy();
    });

    it("hides answers until they are released and shows them afterwards", () => {
        const hidden = render(<SimResultView data={response(result())} />);
        expect(screen.getByText(/richtigen Antworten werden freigegeben/)).toBeTruthy();
        hidden.unmount();
        const released = response(result(), {
            answersReleased: true,
            review: [{ partKey: "LESEN_1", exercises: [{ ordinal: 0, title: "t", transcriptHtml: null, writtenAnswer: null, modelSolution: null, speaking: null, questions: [{ id: "q1", questionNumber: 1, prompt: "Frage eins", options: null, givenAnswer: "B", correctAnswer: "A", correct: false, explanation: null, commonMistake: null }] }] }],
        });
        render(<SimResultView data={released} />);
        expect(screen.getByText("Detailliertes Feedback")).toBeTruthy();
        expect(screen.getByText("A")).toBeTruthy();
    });

    it("shows rubric criteria of an assessed writing task", () => {
        const r = result({
            writtenComplete: true,
            writtenResult: "PASSED",
            pendingAssessmentParts: [],
            parts: [part({ key: "SCHRIFTLICHER_AUSDRUCK", label: "Schriftlicher Ausdruck", method: "MANUAL_RUBRIC", maxPoints: 45, score: 37.5, criteriaScores: { A: 12.5, B: 12.5, C: 12.5 }, assessorComment: "Gut" })],
        });
        render(<SimResultView data={response(r, { rubrics: { SCHRIFTLICHER_AUSDRUCK: [{ key: "A", label: "Aufgabenerfüllung", maxPoints: 15 }, { key: "B", label: "Kommunikative Gestaltung", maxPoints: 15 }, { key: "C", label: "Formale Richtigkeit", maxPoints: 15 }] } })} />);
        expect(screen.getByText(/Aufgabenerfüllung: 12,5 \/ 15/)).toBeTruthy();
        expect(screen.getByText("37,5")).toBeTruthy();
    });
});
