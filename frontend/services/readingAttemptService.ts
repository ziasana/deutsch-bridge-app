import api from "./api";
import {
    AnswerFeedbackResponse,
    AttemptResultResponse,
    CompleteAttemptRequest,
    StartAttemptResponse,
    SubmitAnswerRequest,
} from "@/types/reading";

export const startAttempt = async (articleId: string) => {
    return await api.post<StartAttemptResponse>(`/reading/${articleId}/attempts`);
};

export const submitAnswer = async (attemptId: string, request: SubmitAnswerRequest) => {
    return await api.post<AnswerFeedbackResponse>(`/reading/attempts/${attemptId}/answers`, request);
};

export const completeAttempt = async (attemptId: string, request: CompleteAttemptRequest) => {
    return await api.post<AttemptResultResponse>(`/reading/attempts/${attemptId}/complete`, request);
};
