import api from "./api";
import { SaveVocabRequest, UserVocab } from "@/types/dictionary";

export const getUserVocab = async () => {
    return await api.get<UserVocab[]>("/vocab");
};

export const saveVocab = async (entryId: string) => {
    const request: SaveVocabRequest = { entryId };
    return await api.post<UserVocab>("/vocab", request);
};

export const removeVocab = async (entryId: string) => {
    return await api.delete(`/vocab/${entryId}`);
};
