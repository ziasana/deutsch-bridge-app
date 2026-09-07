import api from "./api";
import {
    Annotation,
    GenerateQuizRequest,
    KeyVocabularyItem,
    ReadingArticle,
    ReadingArticleGenerateRequest,
    ReadingArticleManualRequest,
    ReadingQuizQuestion,
    SuggestAnnotationsRequest,
    SuggestVocabularyRequest,
} from "@/types/reading";

export const generateReadingArticle = async (request: ReadingArticleGenerateRequest) => {
    return await api.post<ReadingArticle>("/admin/reading/generate", request);
};

export const suggestVocabulary = async (request: SuggestVocabularyRequest) => {
    return await api.post<KeyVocabularyItem[]>("/admin/reading/suggest-vocabulary", request);
};

export const suggestAnnotations = async (request: SuggestAnnotationsRequest) => {
    return await api.post<Annotation[]>("/admin/reading/suggest-annotations", request);
};

export const generateQuiz = async (request: GenerateQuizRequest) => {
    return await api.post<ReadingQuizQuestion[]>("/admin/reading/generate-quiz", request);
};

export const getArticleQuizForAdmin = async (id: string) => {
    return await api.get<ReadingQuizQuestion[]>(`/admin/reading/${id}/quiz`);
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
