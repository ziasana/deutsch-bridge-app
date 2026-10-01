import api from "./api";
import {
    Redemittel,
    RedemittelAnswer,
    RedemittelHub,
    RedemittelListParams,
    RedemittelPage,
    RedemittelSession,
} from "@/types/redemittel";

export const getRedemittelHub = () => api.get<RedemittelHub>("/redemittel/hub");

export const getRedemittelPage = (page: number, size: number, params: RedemittelListParams = {}) =>
    api.get<RedemittelPage>("/redemittel", {
        params: {
            page,
            size,
            level: params.level || undefined,
            category: params.category || undefined,
            search: params.search || undefined,
            status: params.status || undefined,
            saved: params.saved || undefined,
        },
    });

export const getRedemittel = (id: string) => api.get<Redemittel>(`/redemittel/${id}`);

export const getTodaysRedemittel = () => api.get<Redemittel[]>("/redemittel/today");

export const getRedemittelReviewSession = (limit = 10) => api.get<RedemittelSession>("/redemittel/review", { params: { limit } });

/** Practice over learned Redemittel: the given ids, or the ones practiced least recently. */
export const getRedemittelPracticeSession = (ids?: string[], size = 10) =>
    api.get<RedemittelSession>("/redemittel/practice", {
        params: { ids: ids && ids.length > 0 ? ids.join(",") : undefined, size },
    });

export const learnRedemittel = (id: string) => api.post<Redemittel>(`/redemittel/${id}/learn`);

export const saveRedemittel = (id: string) => api.post<Redemittel>(`/redemittel/${id}/save`);

export const unsaveRedemittel = (id: string) => api.delete<Redemittel>(`/redemittel/${id}/save`);

export const answerRedemittelPractice = (id: string, exerciseId: string, answer: string) =>
    api.post<RedemittelAnswer>(`/redemittel/${id}/practice`, { exerciseId, answer });

export const answerRedemittelReview = (id: string, exerciseId: string, answer: string) =>
    api.post<RedemittelAnswer>(`/redemittel/${id}/review`, { exerciseId, answer });
