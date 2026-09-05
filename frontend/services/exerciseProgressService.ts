import api from "./api";
import { ExerciseAnswer, ExerciseAnswerRequest } from "@/types/exercise";

export const getExerciseProgress = async () => {
    return await api.get<ExerciseAnswer[]>("/exercise-progress");
};

export const saveExerciseAnswer = async (data: ExerciseAnswerRequest) => {
    return await api.post("/exercise-progress", data);
};

export const resetExerciseProgress = async (questionKeys?: string[]) => {
    return await api.delete("/exercise-progress", { data: questionKeys ?? [] });
};
