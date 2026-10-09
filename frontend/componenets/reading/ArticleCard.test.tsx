// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ArticleCard from "./ArticleCard";
import { ReadingArticleSummary } from "@/types/reading";

vi.mock("@/lib/readingImages", () => ({ getArticleImageSrc: () => "/img.png" }));

const article: ReadingArticleSummary = {
    id: "a1",
    title: "Ein Tag in Berlin",
    categoryId: "c1",
    categoryTitle: "Reisen",
    level: "B1",
    imageUrl: null,
    thumbnailUrl: null,
    viewCount: 12,
    createdAt: "2026-01-01T00:00:00Z",
    newWordCount: 5,
    learned: false,
    bookmarked: false,
};

const props = {
    quizLabel: "Quiz",
    reviewLabel: "Review",
    newWordsLabel: (n: number) => `${n} new for you`,
    viewsLabel: (n: number) => `👁 ${n} views`,
    dateLabel: "Jan 1, 2026",
};

afterEach(cleanup);

describe("ArticleCard", () => {
    it("shows title, topic, level, new words and a Quiz call to action", () => {
        render(<ArticleCard article={article} onOpen={vi.fn()} {...props} />);
        expect(screen.getByText("Ein Tag in Berlin")).toBeTruthy();
        expect(screen.getByText("Reisen")).toBeTruthy();
        expect(screen.getByText("B1")).toBeTruthy();
        expect(screen.getByText("5 new for you")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Quiz" })).toBeTruthy();
    });

    it("opens the article from the card and from the button", () => {
        const onOpen = vi.fn();
        render(<ArticleCard article={article} onOpen={onOpen} {...props} />);
        fireEvent.click(screen.getByRole("button", { name: "Quiz" }));
        fireEvent.click(screen.getByRole("button", { name: "Ein Tag in Berlin" }));
        expect(onOpen).toHaveBeenCalledTimes(2);
        expect(onOpen).toHaveBeenCalledWith("a1");
    });

    it("offers Review for a learned article and the featured label for the up-next card", () => {
        render(<ArticleCard article={{ ...article, learned: true }} featured featuredLabel="Up next for you" onOpen={vi.fn()} {...props} />);
        expect(screen.getByRole("button", { name: "Review" })).toBeTruthy();
        expect(screen.getByText("Up next for you")).toBeTruthy();
    });
});
