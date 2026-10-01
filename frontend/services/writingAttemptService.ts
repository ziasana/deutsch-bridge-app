import api from "./api";
import { WritingAttempt, WritingAttemptRequest, WritingProgress } from "@/types/writing";

export const submitWritingAttempt = async (request: WritingAttemptRequest) => {
    return await api.post<WritingAttempt>("/writing/attempts", request);
};

export const getWritingAttempts = async (exerciseId: string) => {
    return await api.get<WritingAttempt[]>("/writing/attempts", { params: { exerciseId } });
};

/** Optional AI feedback; counts against the daily AI correction limit and is stored after the first call. */
export const requestWritingAiFeedback = async (attemptId: string) => {
    return await api.post<WritingAttempt>(`/writing/attempts/${attemptId}/ai-feedback`);
};

export const getWritingProgress = async () => {
    return await api.get<WritingProgress>("/writing/attempts/progress");
};
