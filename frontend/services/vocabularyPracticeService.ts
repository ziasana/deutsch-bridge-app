import api from "./api";
import { PracticeVocabularySession, VocabularyRoundRequest, VocabularyRoundResponse } from "@/types/vocabulary";

export const getPracticeSession = async (vocabularyItemId?: string) => {
    return await api.get<PracticeVocabularySession>("/vocabulary/practice/session", {
        params: vocabularyItemId ? { vocabularyItemId } : {},
    });
};

export const submitPracticeRound = async (data: VocabularyRoundRequest) => {
    return await api.post<VocabularyRoundResponse>("/vocabulary/practice/round", data);
};
