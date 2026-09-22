import api from "./api";
import {
    SelectionClassifyResult,
    VocabularyCreateRequest,
    VocabularyExistsResult,
    VocabularyFromChatCreateRequest,
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

export const createVocabularyFromChat = async (data: VocabularyFromChatCreateRequest) => {
    return await api.post<VocabularyItem>("/vocabulary/from-chat", data);
};

export const classifySelection = async (selectedText: string, contextText: string) => {
    return await api.post<SelectionClassifyResult>("/vocabulary/classify-selection", { selectedText, contextText });
};

export const checkVocabularyExists = async (word: string) => {
    return await api.get<VocabularyExistsResult>("/vocabulary/exists", { params: { word } });
};
