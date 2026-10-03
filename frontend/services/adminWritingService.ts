import api from "./api";
import { AdminWritingGuideItem, AdminWritingGuideItemRow, AdminWritingPhrase, AdminWritingPhraseRow } from "@/types/writing";
import { AdminRedemittelExercise, AdminRedemittelFunction, RedemittelBulkImportResult } from "@/types/redemittel";

export interface AdminGuideItemFilters {
    level?: string;
    kind?: string;
    active?: string;
    search?: string;
}
export const getAdminWritingGuideItems = (filters: AdminGuideItemFilters = {}) =>
    api.get<AdminWritingGuideItemRow[]>("/admin/writing/guide-items", { params: filters });
export const getAdminWritingGuideItem = (id: string) => api.get<AdminWritingGuideItem>(`/admin/writing/guide-items/${id}`);
export const createAdminWritingGuideItem = (item: AdminWritingGuideItem) => api.post<AdminWritingGuideItem>("/admin/writing/guide-items", item);
export const updateAdminWritingGuideItem = (id: string, item: AdminWritingGuideItem) =>
    api.put<AdminWritingGuideItem>(`/admin/writing/guide-items/${id}`, item);
export const deleteAdminWritingGuideItem = (id: string) => api.delete(`/admin/writing/guide-items/${id}`);

export interface AdminPhraseFilters {
    level?: string;
    category?: string;
    active?: string;
    search?: string;
}
export const getAdminWritingPhrases = (filters: AdminPhraseFilters = {}) =>
    api.get<AdminWritingPhraseRow[]>("/admin/writing/phrases", { params: filters });
export const getAdminWritingPhrase = (id: string) => api.get<AdminWritingPhrase>(`/admin/writing/phrases/${id}`);
export const createAdminWritingPhrase = (p: AdminWritingPhrase) => api.post<AdminWritingPhrase>("/admin/writing/phrases", p);
export const updateAdminWritingPhrase = (id: string, p: AdminWritingPhrase) => api.put<AdminWritingPhrase>(`/admin/writing/phrases/${id}`, p);
export const deleteAdminWritingPhrase = (id: string) => api.delete(`/admin/writing/phrases/${id}`);

export const getAdminRedemittelExercises = (phraseId: string) =>
    api.get<AdminRedemittelExercise[]>(`/admin/writing/phrases/${phraseId}/exercises`);
/** Replaces the whole set of practice exercises of a Redemittel. */
export const saveAdminRedemittelExercises = (phraseId: string, exercises: AdminRedemittelExercise[]) =>
    api.put<AdminRedemittelExercise[]>(`/admin/writing/phrases/${phraseId}/exercises`, exercises);
export const getAdminRedemittelExerciseCounts = (level: string) =>
    api.get<Record<string, number>>("/admin/writing/phrases/exercise-counts", { params: { level } });

export const getAdminRedemittelFunctions = () => api.get<AdminRedemittelFunction[]>("/admin/writing/functions");
export const createAdminRedemittelFunction = (f: AdminRedemittelFunction) => api.post<AdminRedemittelFunction>("/admin/writing/functions", f);
export const updateAdminRedemittelFunction = (id: string, f: AdminRedemittelFunction) =>
    api.put<AdminRedemittelFunction>(`/admin/writing/functions/${id}`, f);
export const deleteAdminRedemittelFunction = (id: string) => api.delete(`/admin/writing/functions/${id}`);

/** Best-effort bulk import: every row is saved on its own and reported back. */
export const bulkImportRedemittel = (rows: unknown[]) => api.post<RedemittelBulkImportResult>("/admin/writing/phrases/bulk", rows);
