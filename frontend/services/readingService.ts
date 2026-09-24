import api from "./api";
import { ReadingArticle, ReadingArticlePage, ReadingLevelSummary } from "@/types/reading";

/** Lightweight list shape for one level - never the full articles. page is zero-based. */
export const getReadingArticlesPage = async (level: string, page: number, size: number, search?: string) => {
    return await api.get<ReadingArticlePage>("/reading", {
        params: { level, page, size, search: search || undefined },
    });
};

/** Per-level totals and the current user's learned counts, for the level selector. */
export const getReadingLevelSummary = async () => {
    return await api.get<ReadingLevelSummary[]>("/reading/level-summary");
};

export const getReadingArticleById = async (id: string) => {
    return await api.get<ReadingArticle>(`/reading/${id}`);
};

/** Counted on every open, separately from the (cacheable) article fetch. */
export const recordReadingArticleView = async (id: string) => {
    return await api.post<{ viewCount: number }>(`/reading/${id}/view`);
};
