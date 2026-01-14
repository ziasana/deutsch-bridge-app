import api from "./api";
import {
    AddVocabularyType,
    DeleteVocabularyType, GenerateAiWordType, SaveVocabularyPracticeType,
    UpdateVocabularyType, VocabularyForPracticeType,
    VocabularyPracticeType,
    VocabularyType
} from "@/types/vocabulary";

export const getUserVocabularies = async () => {
    return await api.get<VocabularyType[]>("/vocabulary/get-user");
}

export const getUserVocabularyWithPractice = async () => {
    return await api.get<VocabularyPracticeType[]>("/vocabulary-practice");
}

export const getUserVocabularyForPractice = async () => {
    return await api.get<VocabularyForPracticeType[]>("/vocabulary-practice/for-practice");
}

export const addUserVocabularyPractice = async (data:SaveVocabularyPracticeType) => {
    return await api.post("/vocabulary-practice", data);
}

export const addVocabulary = async (data: AddVocabularyType) => {
    return await api.post<VocabularyType[]>("/vocabulary", data);
}

export const generateAiExample = async (data: GenerateAiWordType) => {
    return await api.post<GenerateAiWordType>("/ollama/generate-example", data);
}

export const deleteVocabulary= async(data: DeleteVocabularyType) => {
    return await api.delete("/vocabulary", { data: data });

}

export const updateVocabulary= async(data: UpdateVocabularyType ) => {
    return await api.put("/vocabulary", data )

}