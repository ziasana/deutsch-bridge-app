import api from "./api";
import {AddVocabularyType, DeleteVocabularyType, UpdateVocabularyType, VocabularyType} from "@/types/vocabulary";
import {AuthenticatedRequest} from "@/types/authenticatedRequest";

export const getUserVocabularies = async (data:AuthenticatedRequest) => {
    return await api.post<VocabularyType[]>("/api/vocabulary/get-user", data);
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