// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { Mic } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExamExercisePublicResponse } from "@/types/exam";
import ExerciseTopHeader from "./ExerciseTopHeader";

vi.mock("./ExamExerciseTimer", () => ({ default: ({ variant }: { variant?: string }) => <div data-testid="timer">{variant}</div> }));

afterEach(cleanup);

const header = (examType: "TELC" | "DTZ", showTimer?: boolean) => (
    <ExerciseTopHeader
        exercise={{ id: "1", title: "x", level: "B1", examType, teilDescription: null } as unknown as ExamExercisePublicResponse}
        accent="speaking"
        icon={Mic}
        kicker="Teil 1"
        sectionLabel="Mündlicher Ausdruck"
        title="Über sich sprechen"
        showTimer={showTimer}
        bookmarked={false}
        bookmarkPending={false}
        onToggleBookmark={() => undefined}
    />
);

describe("ExerciseTopHeader timer", () => {
    it.each(["TELC", "DTZ"] as const)("shows the timer ring for %s exercises", (exam) => {
        render(header(exam));
        expect(screen.getByTestId("timer").textContent).toBe("ring");
    });

    it("hides the timer when the section has none (Hören)", () => {
        render(header("DTZ", false));
        expect(screen.queryByTestId("timer")).toBeNull();
    });
});
