// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ExamSetList from "./ExamSetList";
import type { AttemptSummary, ProfileOverview, SetOverview } from "@/types/examSimulation";

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

/** An exam whose last attempt was not passed. */
const retrySet = (): SetOverview => ({
    id: "s1", number: 1, title: "Prüfung 1", status: "RETRY", attemptId: "a1",
    attempt: { id: "a1", writtenScore: 90, writtenMax: 225, overallResult: "NOT_PASSED", writtenResult: "NOT_PASSED", writtenComplete: true, awaitingAssessment: false, startedAtMs: 1, endedAtMs: 2, durationSeconds: 60 } as unknown as AttemptSummary,
});

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

    it("offers a Wiederholung for an exam that was not passed, and starts that exam again", () => {
        const onStart = vi.fn();
        const failed = profile({ sets: [retrySet()] });
        render(<ExamSetList profile={failed} starting={false} onStart={onStart} />);
        expect(screen.getAllByText(/Nicht bestanden/).length).toBeGreaterThan(0);
        expect(screen.getByRole("link", { name: /Ergebnis ansehen/ }).getAttribute("href")).toContain("ergebnis?attempt=a1");
        fireEvent.click(screen.getByRole("button", { name: /Wiederholung/ }));
        expect(onStart).toHaveBeenCalledWith("s1");
    });

    it("disables the Wiederholung while another exam is running", () => {
        const failed = profile({ activeAttemptId: "x", sets: [retrySet()] });
        render(<ExamSetList profile={failed} starting={false} onStart={vi.fn()} />);
        expect((screen.getByRole("button", { name: /Wiederholung/ }) as HTMLButtonElement).disabled).toBe(true);
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
