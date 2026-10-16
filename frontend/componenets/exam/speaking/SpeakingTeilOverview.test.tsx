// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExamExerciseSummaryResponse } from "@/types/exam";
import SpeakingTeilOverview from "./SpeakingTeilOverview";

vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/exam/useExamBookmark", () => ({ useExamBookmark: () => ({ toggle: vi.fn(), pendingId: null }) }));
const timeConfig = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/exam/useExamTimeConfiguration", () => ({ useExamTimeConfiguration: timeConfig }));

afterEach(cleanup);
beforeEach(() => timeConfig.mockReset().mockReturnValue({ minutes: 4, isLoading: false }));

const item = (id: string, title: string, completed = false) =>
    ({ id, title, completed, bookmarked: false, score: completed ? 100 : null, questionsCount: 0 }) as unknown as ExamExerciseSummaryResponse;
const items = [item("1", "Einkaufen"), item("2", "Reisen", true)];
const base = { items, level: "B1", teil: 2, heading: "Teil 2", backHref: "/dashboard/exam-prep", backLabel: "Mündliche Prüfung" };

describe("SpeakingTeilOverview", () => {
    it("shows the DTZ Teil page like the Telc one: hero, learn shortcut to the DTZ Lernbereich, Übungen list and the DTZ Zeit-Check", () => {
        render(<SpeakingTeilOverview {...base} exam="DTZ" />);
        expect(screen.getByRole("heading", { name: "Teil 2" })).toBeTruthy();
        expect(screen.getByText("Mündliche Prüfung · DTZ A2-B1")).toBeTruthy();
        expect(screen.getByText("Über Erfahrungen sprechen")).toBeTruthy();
        expect(screen.getByRole("link", { name: /Zum Lernbereich/ }).getAttribute("href")).toContain("exam=DTZ");
        expect(screen.getByRole("region", { name: "Zeit-Check" }).textContent).toContain("4 Min.");
        expect(timeConfig).toHaveBeenCalledWith("B1", "MUENDLICHER_AUSDRUCK", 2, "DTZ");
        expect(within(screen.getByRole("region", { name: "Übungen" })).getAllByRole("button", { name: /./ }).length).toBeGreaterThan(0);
    });

    it("keeps the Telc Teil page unchanged", () => {
        render(<SpeakingTeilOverview {...base} />);
        expect(screen.getByText("Mündlicher Ausdruck · B1")).toBeTruthy();
        expect(screen.getByRole("region", { name: "Zeit-Check" })).toBeTruthy();
        expect(screen.getByRole("link", { name: /Zum Lernbereich/ }).getAttribute("href")).not.toContain("exam=DTZ");
    });
});
