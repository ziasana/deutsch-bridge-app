import api from "./api";
import {
    ReadingArticle,
    ReadingArticleNavigation,
    ReadingArticlePage,
    ReadingCategory,
    ReadingLevelSummary,
} from "@/types/reading";

/** Lightweight list shape for one level - never the full articles. page is zero-based. */
export const getReadingArticlesPage = async (
    level: string,
    page: number,
    size: number,
    search?: string,
    bookmarked?: boolean,
    categoryId?: string
) => {
    return await api.get<ReadingArticlePage>("/reading", {
        params: {
            level,
            page,
            size,
            search: search || undefined,
            bookmarked: bookmarked || undefined,
            categoryId: categoryId || undefined,
        },
    });
};

/** Per-level totals and the current user's learned counts, for the level selector. */
export const getReadingLevelSummary = async () => {
    return await api.get<ReadingLevelSummary[]>("/reading/level-summary");
};

/** Every category ("Thema"), for the reading list's filter dropdown. */
export const getReadingCategories = async () => {
    return await api.get<ReadingCategory[]>("/reading/categories");
};

export const getReadingArticleById = async (id: string) => {
    return await api.get<ReadingArticle>(`/reading/${id}`);
};

/** The previous/next article in the current level's list order, for the Previous/Next controls. */
export const getReadingArticleNavigation = async (id: string) => {
    return await api.get<ReadingArticleNavigation>(`/reading/${id}/navigation`);
};

/** Counted on every open, separately from the (cacheable) article fetch. */
export const recordReadingArticleView = async (id: string) => {
    return await api.post<{ viewCount: number }>(`/reading/${id}/view`);
};

export const addReadingArticleBookmark = async (id: string) => {
    return await api.post<ReadingArticle>(`/reading/${id}/bookmark`);
};

export const removeReadingArticleBookmark = async (id: string) => {
    return await api.delete<ReadingArticle>(`/reading/${id}/bookmark`);
};
