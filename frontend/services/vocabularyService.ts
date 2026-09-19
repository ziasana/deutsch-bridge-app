import api from "./api";
import {
    VocabularyCreateRequest,
    VocabularyItem,
    VocabularySource,
    VocabularyUpdateRequest,
} from "@/types/vocabulary";

export interface GetVocabularyParams {
    source?: VocabularySource;
    level?: string;
    bookmarked?: boolean;
}

export const getVocabulary = async (params: GetVocabularyParams = {}) => {
    return await api.get<VocabularyItem[]>("/vocabulary", { params });
};

export const getVocabularyById = async (id: string) => {
    return await api.get<VocabularyItem>(`/vocabulary/${id}`);
};

export const createVocabulary = async (data: VocabularyCreateRequest) => {
    return await api.post<VocabularyItem>("/vocabulary", data);
};

export const addFromDictionary = async (dictionaryEntryId: string) => {
    return await api.post<VocabularyItem>(`/vocabulary/from-dictionary/${dictionaryEntryId}`);
};

export const updateVocabulary = async (id: string, data: VocabularyUpdateRequest) => {
    return await api.put<VocabularyItem>(`/vocabulary/${id}`, data);
};

export const deleteVocabulary = async (id: string) => {
    return await api.delete<void>(`/vocabulary/${id}`);
};

export const addVocabularyBookmark = async (id: string) => {
    return await api.post<VocabularyItem>(`/vocabulary/${id}/bookmark`);
};

export const removeVocabularyBookmark = async (id: string) => {
    return await api.delete<VocabularyItem>(`/vocabulary/${id}/bookmark`);
};
