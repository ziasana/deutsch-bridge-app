import api from "./api";
import { GrammarCategory, GrammarCategoryManualRequest, GrammarLesson, GrammarLessonManualRequest } from "@/types/grammar";

export const getGrammarLessonsAdmin = async () => {
    return await api.get<GrammarLesson[]>("/admin/grammar");
};

export const uploadGrammarLessonImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return await api.post<{ url: string }>("/admin/grammar/upload-image", formData, {
        headers: { "Content-Type": undefined },
    });
};

export const createGrammarLesson = async (request: GrammarLessonManualRequest) => {
    return await api.post<GrammarLesson>("/admin/grammar", request);
};

export const bulkImportGrammarLessons = async (requests: GrammarLessonManualRequest[]) => {
    return await api.post<GrammarLesson[]>("/admin/grammar/bulk", requests);
};

export const updateGrammarLesson = async (id: string, request: GrammarLessonManualRequest) => {
    return await api.put<GrammarLesson>(`/admin/grammar/${id}`, request);
};

export const deleteGrammarLesson = async (id: string) => {
    return await api.delete(`/admin/grammar/${id}`);
};

export const getGrammarCategoriesAdmin = async () => {
    return await api.get<GrammarCategory[]>("/admin/grammar/categories");
};

export const createGrammarCategory = async (request: GrammarCategoryManualRequest) => {
    return await api.post<GrammarCategory>("/admin/grammar/categories", request);
};

export const updateGrammarCategory = async (id: string, request: GrammarCategoryManualRequest) => {
    return await api.put<GrammarCategory>(`/admin/grammar/categories/${id}`, request);
};

export const deleteGrammarCategory = async (id: string) => {
    return await api.delete(`/admin/grammar/categories/${id}`);
};
