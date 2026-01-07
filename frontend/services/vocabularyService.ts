import api from "./api";
import {
    AddVocabularyType,
    DeleteVocabularyType, SaveVocabularyPracticeType,
    UpdateVocabularyType, VocabularyForPracticeType,
    VocabularyPracticeType,
    VocabularyType
} from "@/types/vocabulary";

export const getUserVocabularies = async () => {
    return await api.get<VocabularyType[]>("/api/vocabulary/get-user");
}

export const getUserVocabularyWithPractice = async () => {
    return await api.get<VocabularyPracticeType[]>("/api/vocabulary-practice");
}

export const getUserVocabularyForPractice = async () => {
    return await api.get<VocabularyForPracticeType[]>("/api/vocabulary-practice/for-practice");
}

export const addUserVocabularyPractice = async (data:SaveVocabularyPracticeType) => {
    return await api.post("/api/vocabulary-practice", data);
}

export const addVocabulary = async (data: AddVocabularyType) => {
    return await api.post<VocabularyType[]>("/api/vocabulary", data);
}

export const deleteVocabulary= async(data: DeleteVocabularyType) => {
    return await api.delete("api/vocabulary", { data: data });

}

export const updateVocabulary= async(data: UpdateVocabularyType ) => {
    return await api.put("/api/vocabulary", data )

}