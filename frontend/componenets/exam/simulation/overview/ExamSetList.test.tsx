// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ExamSetList from "./ExamSetList";
import type { ProfileOverview } from "@/types/examSimulation";

const profile = (overrides: Partial<ProfileOverview> = {}) =>
    ({
        activeAttemptId: null,
        activeAttemptPaused: false,
        writtenPassThreshold: 135,
        totalMinutes: 120,
        parts: [{ section: "LESEVERSTEHEN" }, { section: "HOERVERSTEHEN" }],
        sets: [
            { id: "s1", number: 1, title: "Prüfung 1", status: "DONE", attemptId: "a1", attempt: { id: "a1", writtenScore: 180, writtenMax: 225, overallResult: null, writtenResult: "PASSED", writtenComplete: true, awaitingAssessment: false, startedAtMs: 1, endedAtMs: 2, durationSeconds: 60 } },
            { id: "s2", number: 2, title: "Prüfung 2", status: "NEW", attemptId: null, attempt: null },
        ],
        ...overrides,
    }) as unknown as ProfileOverview;

describe("ExamSetList", () => {
    afterEach(cleanup);

    it("shows the result of a finished exam and a start button for a new one", () => {
        const onStart = vi.fn();
        render(<ExamSetList profile={profile()} starting={false} onStart={onStart} />);
        expect(screen.getByRole("heading", { name: "Prüfung 1" })).toBeTruthy();
        expect(screen.getByText("Bestes Ergebnis")).toBeTruthy();
        expect(screen.getByText("180")).toBeTruthy();
        expect(screen.getByText("1 von 2")).toBeTruthy();
        expect(screen.getByRole("link", { name: /Ergebnis ansehen/ }).getAttribute("href")).toContain("ergebnis?attempt=a1");
        fireEvent.click(screen.getByRole("button", { name: /Prüfung starten/ }));
        expect(onStart).toHaveBeenCalledWith("s2");
    });

    it("blocks starting while another exam is running", () => {
        render(<ExamSetList profile={profile({ activeAttemptId: "x" })} starting={false} onStart={vi.fn()} />);
        expect((screen.getByRole("button", { name: /Prüfung starten/ }) as HTMLButtonElement).disabled).toBe(true);
    });

    it("explains when no exams are published", () => {
        render(<ExamSetList profile={profile({ sets: [] })} starting={false} onStart={vi.fn()} />);
        expect(screen.getByText(/noch keine Prüfungen/)).toBeTruthy();
    });
});
