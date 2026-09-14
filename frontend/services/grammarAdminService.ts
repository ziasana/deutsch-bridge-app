import api from "./api";
import { GrammarLesson, GrammarLessonManualRequest } from "@/types/grammar";

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

export const updateGrammarLesson = async (id: string, request: GrammarLessonManualRequest) => {
    return await api.put<GrammarLesson>(`/admin/grammar/${id}`, request);
};

export const deleteGrammarLesson = async (id: string) => {
    return await api.delete(`/admin/grammar/${id}`);
};
