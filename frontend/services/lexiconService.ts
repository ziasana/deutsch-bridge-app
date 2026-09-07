import api from "./api";
import { SaveLexiconRequest, SrsReviewRequest, UserWordProgress } from "@/types/reading";

export const getLexicon = async () => {
    return await api.get<UserWordProgress[]>("/lexicon");
};

export const saveToLexicon = async (request: SaveLexiconRequest) => {
    return await api.post<UserWordProgress>("/lexicon", request);
};

export const getReviewQueue = async () => {
    return await api.get<UserWordProgress[]>("/lexicon/review-queue");
};

export const reviewWord = async (request: SrsReviewRequest) => {
    return await api.post<UserWordProgress>("/lexicon/review", request);
};
