import api from "./api";
import { ExamSection } from "@/types/exam";
import {
    ExamPracticeSession,
    ExamPracticeSessionResult,
    ExamPracticeSessionStartRequest,
    ExamTimeBulkUpdateRequest,
    ExamExerciseLastTime,
    ExamTimeConfiguration,
    ExamTimeManagementRow,
    ExamTimeWeekSummary,
    ExamTimeSettings,
} from "@/types/examTime";

// ---- admin ----

export const getExamTimeSettings = async (level: string) => {
    return await api.get<ExamTimeSettings>("/admin/exam-time-configurations", { params: { level } });
};

export const saveExamTimeSettings = async (request: ExamTimeBulkUpdateRequest) => {
    return await api.put<ExamTimeSettings>("/admin/exam-time-configurations", request);
};

export const resetExamTimeSettings = async (level: string) => {
    return await api.post<ExamTimeSettings>("/admin/exam-time-configurations/reset", null, { params: { level } });
};

// ---- learner ----

/** Enabled Teil targets for a level. An empty list means timing is not available for it. */
export const getExamTimeConfigurations = async (level: string) => {
    return await api.get<ExamTimeConfiguration[]>("/exam-time-configurations", { params: { level } });
};

export const startExamPracticeSession = async (request: ExamPracticeSessionStartRequest) => {
    return await api.post<ExamPracticeSession>("/exam/practice-sessions", request);
};

export const completeExamPracticeSession = async (id: string, pausedSeconds: number) => {
    return await api.post<ExamPracticeSessionResult>(`/exam/practice-sessions/${id}/complete`, { pausedSeconds });
};

export const getExamTimeWeekSummary = async () => {
    return await api.get<ExamTimeWeekSummary>("/exam/practice-sessions/week-summary");
};

export const getExamTimeManagement = async (level: string) => {
    return await api.get<ExamTimeManagementRow[]>("/exam/practice-sessions/time-management", { params: { level } });
};

export const getExamExerciseLastTimes = async (section: ExamSection, level: string) => {
    return await api.get<ExamExerciseLastTime[]>("/exam/practice-sessions/last-times", { params: { section, level } });
};
