import api from "./api";
import { ExamExercisePublicResponse, ExamSection, ExamTaskType } from "@/types/exam";

export const getExamExercises = async (section?: ExamSection, level?: string, taskType?: ExamTaskType) => {
    return await api.get<ExamExercisePublicResponse[]>("/exam", {
        params: { section, level, taskType },
    });
};

export const getExamExerciseById = async (id: string) => {
    return await api.get<ExamExercisePublicResponse>(`/exam/${id}`);
};
