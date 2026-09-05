import api from "./api";
import { ReadingArticle } from "@/types/reading";

export const getReadingArticles = async (level?: string) => {
    return await api.get<ReadingArticle[]>("/reading", { params: level ? { level } : undefined });
};

export const getReadingArticleById = async (id: string) => {
    return await api.get<ReadingArticle>(`/reading/${id}`);
};
