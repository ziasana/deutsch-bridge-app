import api from "./api";
import { AdminWritingGuideItem, AdminWritingPhrase } from "@/types/writing";

export const getAdminWritingGuideItems = (level: string) =>
    api.get<AdminWritingGuideItem[]>("/admin/writing/guide-items", { params: { level } });
export const createAdminWritingGuideItem = (item: AdminWritingGuideItem) => api.post<AdminWritingGuideItem>("/admin/writing/guide-items", item);
export const updateAdminWritingGuideItem = (id: string, item: AdminWritingGuideItem) =>
    api.put<AdminWritingGuideItem>(`/admin/writing/guide-items/${id}`, item);
export const deleteAdminWritingGuideItem = (id: string) => api.delete(`/admin/writing/guide-items/${id}`);

export const getAdminWritingPhrases = (level: string) => api.get<AdminWritingPhrase[]>("/admin/writing/phrases", { params: { level } });
export const createAdminWritingPhrase = (p: AdminWritingPhrase) => api.post<AdminWritingPhrase>("/admin/writing/phrases", p);
export const updateAdminWritingPhrase = (id: string, p: AdminWritingPhrase) => api.put<AdminWritingPhrase>(`/admin/writing/phrases/${id}`, p);
export const deleteAdminWritingPhrase = (id: string) => api.delete(`/admin/writing/phrases/${id}`);
