import api from "./api";
import {
    ExamExercisePublicResponse,
    ExamExerciseSummaryResponse,
    ExamLevelSummaryResponse,
    ExamPendingBookmark,
    ExamSection,
    ExamTaskType,
} from "@/types/exam";

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

/** Bookmarked-but-not-mastered exercises across all levels, oldest bookmark first. */
export const getPendingExamBookmarks = async () => {
    return await api.get<ExamPendingBookmark[]>("/exam/bookmarks/pending");
};

export const addExamExerciseBookmark = async (id: string) => {
    return await api.post<ExamExerciseSummaryResponse>(`/exam/${id}/bookmark`);
};

export const removeExamExerciseBookmark = async (id: string) => {
    return await api.delete<ExamExerciseSummaryResponse>(`/exam/${id}/bookmark`);
};
