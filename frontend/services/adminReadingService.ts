import api from "./api";
import {
    KeyVocabularyItem,
    ReadingArticle,
    ReadingArticleGenerateRequest,
    ReadingArticleManualRequest,
    SuggestVocabularyRequest,
} from "@/types/reading";

export const generateReadingArticle = async (request: ReadingArticleGenerateRequest) => {
    return await api.post<ReadingArticle>("/admin/reading/generate", request);
};

export const suggestVocabulary = async (request: SuggestVocabularyRequest) => {
    return await api.post<KeyVocabularyItem[]>("/admin/reading/suggest-vocabulary", request);
};

export const createReadingArticle = async (request: ReadingArticleManualRequest) => {
    return await api.post<ReadingArticle>("/admin/reading", request);
};

export const updateReadingArticle = async (id: string, request: ReadingArticleManualRequest) => {
    return await api.put<ReadingArticle>(`/admin/reading/${id}`, request);
};

export const deleteReadingArticle = async (id: string) => {
    return await api.delete(`/admin/reading/${id}`);
};
