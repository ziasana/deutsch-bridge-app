import api from "./api";
import { GrammarLesson, LearningProgressRequest } from "@/types/grammar";

export const getGrammarLessons = async () => {
    return await api.get<GrammarLesson[]>("/grammar");
};

export const setLearningProgress = async (request: LearningProgressRequest) => {
    return await api.post("/learning-progress", request);
};
