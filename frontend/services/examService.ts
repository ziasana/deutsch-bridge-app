import api from "./api";
import { ExamExercisePublicResponse, ExamExerciseSummaryResponse, ExamLevelSummaryResponse, ExamSection, ExamTaskType } from "@/types/exam";

/** Lightweight navigation shape - no passages/questions/answerOptions. Use for lists/summaries only. */
export const getExamExercisesSummary = async (section?: ExamSection, level?: string, taskType?: ExamTaskType) => {
    return await api.get<ExamExerciseSummaryResponse[]>("/exam", {
        params: { section, level, taskType },
    });
};

/** Per-level aggregate progress across every practicable section, for the level selector. */
export const getExamLevelSummary = async () => {
    return await api.get<ExamLevelSummaryResponse[]>("/exam/level-summary");
};

export const getExamExerciseById = async (id: string) => {
    return await api.get<ExamExercisePublicResponse>(`/exam/${id}`);
};
