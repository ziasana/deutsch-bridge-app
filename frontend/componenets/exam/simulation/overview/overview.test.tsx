// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ExamJourney from "./ExamJourney";
import StartDialog from "./StartDialog";
import type { ProfileOverview } from "@/types/examSimulation";

const part = (key: string, label: string, section: string, module: string, stageKey: string, maxPoints: number) => ({
    key, label, section, module, teil: 1, questionCount: 5, pointsPerQuestion: 5, maxPoints, scoringMethod: module === "ORAL" ? "UNSCORED" : "PER_QUESTION",
    stageKey, rubric: [], required: 1, eligible: 3, unused: 3,
});

const profile = {
    id: "p", title: "telc B1", totalMinutes: 120, writtenMaxPoints: 100, writtenPassThreshold: 60, oralScoringEnabled: false, oralMaxPoints: 0, oralPassThreshold: 0,
    stages: [
        { key: "LESEN", label: "Lesen", minutes: 90, kind: "WORKING", partKeys: ["L1"] },
        { key: "HOEREN", label: "Hören", minutes: 30, kind: "WORKING", partKeys: ["H1"] },
    ],
    parts: [part("L1", "Leseverstehen Teil 1", "LESEVERSTEHEN", "WRITTEN", "LESEN", 50), part("H1", "Hörverstehen Teil 1", "HOERVERSTEHEN", "WRITTEN", "HOEREN", 50)],
} as unknown as ProfileOverview;

describe("exam overview", () => {
    afterEach(cleanup);

    it("selecting a section of the journey shows its parts", () => {
        render(<ExamJourney profile={profile} />);
        expect(screen.getAllByText("Leseverstehen Teil 1").length).toBeGreaterThan(0);
        fireEvent.click(screen.getByRole("button", { name: /Hören, 30 Minuten/ }));
        expect(screen.getByText(/Minute 90–120/)).toBeTruthy();
        expect(screen.getAllByText("Hörverstehen Teil 1").length).toBeGreaterThan(0);
    });

    it("the start dialog counts checked items but never blocks the start", () => {
        const onStart = vi.fn();
        render(<StartDialog totalMinutes={120} starting={false} onStart={onStart} onCancel={vi.fn()} />);
        fireEvent.click(screen.getAllByRole("checkbox")[0]);
        expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1");
        fireEvent.click(screen.getByRole("button", { name: /Trotzdem starten/ }));
        expect(onStart).toHaveBeenCalledTimes(1);
    });
});
