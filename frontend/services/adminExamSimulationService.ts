import api from "./api";
import {
    AdminAttemptRow,
    AssessmentQueueItem,
    AttemptStatus,
    AuditEntry,
    AvailabilityResponse,
    ExamProfileRequest,
    ExamProfileResponse,
    ExamResult,
    ValidationResponse,
} from "@/types/examSimulation";

const base = "/admin/exam-simulation";

export const adminListExamProfiles = () => api.get<ExamProfileResponse[]>(`${base}/profiles`);
export const adminGetExamProfile = (id: string) => api.get<ExamProfileResponse>(`${base}/profiles/${id}`);
export const adminCreateExamProfile = (request: ExamProfileRequest) => api.post<ExamProfileResponse>(`${base}/profiles`, request);
export const adminUpdateExamProfile = (id: string, request: ExamProfileRequest) => api.put<ExamProfileResponse>(`${base}/profiles/${id}`, request);
export const adminDuplicateExamProfile = (id: string) => api.post<ExamProfileResponse>(`${base}/profiles/${id}/duplicate`);
export const adminValidateExamProfile = (id: string) => api.post<ValidationResponse>(`${base}/profiles/${id}/validate`);
export const adminPublishExamProfile = (id: string, verificationNote: string) =>
    api.post<ExamProfileResponse>(`${base}/profiles/${id}/publish`, { verificationNote });
export const adminDeactivateExamProfile = (id: string) => api.post<ExamProfileResponse>(`${base}/profiles/${id}/deactivate`);
export const adminArchiveExamProfile = (id: string) => api.post<ExamProfileResponse>(`${base}/profiles/${id}/archive`);
export const adminExamProfileAvailability = (id: string) => api.get<AvailabilityResponse>(`${base}/profiles/${id}/availability`);
export const adminExamProfileAudit = (id: string) => api.get<AuditEntry[]>(`${base}/profiles/${id}/audit`);

export const adminListExamAttempts = (status?: AttemptStatus) =>
    api.get<AdminAttemptRow[]>(`${base}/attempts`, { params: status ? { status } : undefined });
export const adminExamAttemptAudit = (attemptId: string) => api.get<AuditEntry[]>(`${base}/attempts/${attemptId}/audit`);
export const adminAssessmentQueue = () => api.get<AssessmentQueueItem[]>(`${base}/assessments/queue`);
export const adminAssessPart = (attemptId: string, partKey: string, criteriaScores: Record<string, number>, comment: string) =>
    api.put<ExamResult>(`${base}/attempts/${attemptId}/parts/${partKey}/assessment`, { criteriaScores, comment });
export const adminAiEstimate = (attemptId: string, partKey: string) =>
    api.post<{ feedback: string; official: string }>(`${base}/attempts/${attemptId}/parts/${partKey}/ai-estimate`);
