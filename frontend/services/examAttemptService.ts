import api from "./api";
import {
    CompleteExamAttemptRequest,
    ExamAnswerFeedbackResponse,
    ExamAttemptResultResponse,
    StartExamAttemptResponse,
    SubmitExamAnswerRequest,
} from "@/types/exam";

export const startExamAttempt = async (exerciseId: string) => {
    return await api.post<StartExamAttemptResponse>(`/exam/${exerciseId}/attempts`);
};

export const submitExamAnswer = async (attemptId: string, request: SubmitExamAnswerRequest) => {
    return await api.post<ExamAnswerFeedbackResponse>(`/exam/attempts/${attemptId}/answers`, request);
};

export const completeExamAttempt = async (attemptId: string, request: CompleteExamAttemptRequest = {}) => {
    return await api.post<ExamAttemptResultResponse>(`/exam/attempts/${attemptId}/complete`, request);
};

export const markExerciseCompleted = async (exerciseId: string) => {
    return await api.post<void>(`/exam/${exerciseId}/mark-completed`);
};

export const unmarkExerciseCompleted = async (exerciseId: string) => {
    return await api.delete<void>(`/exam/${exerciseId}/mark-completed`);
};
