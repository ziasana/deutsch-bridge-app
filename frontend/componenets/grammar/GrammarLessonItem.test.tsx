// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GrammarLessonItem from "./GrammarLessonItem";

const labels = { bookmark: "Bookmark", unbookmark: "Remove bookmark", practice: "Practice", review: "Review" };
const base = {
    number: 2,
    title: "Der Akkusativ",
    summary: "Wen oder was?",
    dir: "ltr" as const,
    level: "A2",
    learned: false,
    bookmarked: false,
    bookmarkPending: false,
    hasQuiz: true,
    isLast: false,
    labels,
};

afterEach(cleanup);

describe("GrammarLessonItem", () => {
    it("shows the number, title, summary and the Practice action", () => {
        render(<GrammarLessonItem {...base} onOpen={vi.fn()} onPractice={vi.fn()} onToggleBookmark={vi.fn()} />);
        expect(screen.getByText("2")).toBeTruthy();
        expect(screen.getByText("Der Akkusativ")).toBeTruthy();
        expect(screen.getByText("Wen oder was?")).toBeTruthy();
        expect(screen.getByRole("button", { name: /Practice/ })).toBeTruthy();
    });

    it("opens the lesson from the card but not when using the bookmark or practice buttons", () => {
        const onOpen = vi.fn();
        const onPractice = vi.fn();
        const onToggleBookmark = vi.fn();
        render(<GrammarLessonItem {...base} onOpen={onOpen} onPractice={onPractice} onToggleBookmark={onToggleBookmark} />);
        fireEvent.click(screen.getByRole("button", { name: "Bookmark" }));
        fireEvent.click(screen.getByRole("button", { name: /Practice/ }));
        expect(onToggleBookmark).toHaveBeenCalledTimes(1);
        expect(onPractice).toHaveBeenCalledTimes(1);
        expect(onOpen).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole("button", { name: "Der Akkusativ" }));
        expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it("shows Review for a learned lesson, replaces the number with a check, and labels the next lesson", () => {
        render(<GrammarLessonItem {...base} learned nextLabel="Next up" onOpen={vi.fn()} onPractice={vi.fn()} onToggleBookmark={vi.fn()} />);
        expect(screen.getByRole("button", { name: /Review/ })).toBeTruthy();
        expect(screen.queryByText("2")).toBeNull();
        expect(screen.getByText("Next up")).toBeTruthy();
    });
});
