import api from "./api";
import {
    ExamContentOptions,
    ExamContentStatus,
    ImportResult,
    PromptRequest,
    PromptResponse,
    StatusChangeResult,
    ValidationReport,
} from "@/types/examContent";

export const getExamContentOptions = async () => api.get<ExamContentOptions>("/admin/exam-content/options");

/** The saved topic list changes of one generator, e.g. partKey DTZ_TEIL_5: topics the admin added and built-in topics the admin removed. */
export interface GeneratorTopics {
    custom: string[];
    hidden: string[];
}

export const getGeneratorTopics = async (partKey: string) =>
    api.get<GeneratorTopics>("/admin/exam-content/topics", { params: { partKey } });

export const addGeneratorTopic = async (partKey: string, topic: string) =>
    api.post<GeneratorTopics>("/admin/exam-content/topics", { partKey, topic });

export const removeGeneratorTopic = async (partKey: string, topic: string) =>
    api.post<GeneratorTopics>("/admin/exam-content/topics/remove", { partKey, topic });

/** Removes (hidden = true) or brings back one built-in topic, given by its token. */
export const setGeneratorTopicHidden = async (partKey: string, topic: string, hidden: boolean) =>
    api.post<GeneratorTopics>("/admin/exam-content/topics/hidden", { partKey, topic, hidden });

export const restoreGeneratorTopics = async (partKey: string) =>
    api.post<GeneratorTopics>("/admin/exam-content/topics/restore", null, { params: { partKey } });

export const generateExamContentPrompt = async (request: PromptRequest) =>
    api.post<PromptResponse>("/admin/exam-content/prompt", request);

/** The starter file (import format) of a Mündlicher Ausdruck Teil, as text. */
export const getSpeakingStarter = async (part: number) =>
    api.get<string>(`/admin/exam-content/speaking-starter/${part}`, { responseType: "text", transformResponse: (data) => data });

export const validateExamContent = async (json: string) => api.post<ValidationReport>("/admin/exam-content/validate", { json });

export const importExamContent = async (json: string, selectedIndexes: number[]) =>
    api.post<ImportResult>("/admin/exam-content/import", { json, selectedIndexes });

export const changeExamContentStatus = async (ids: string[], status: ExamContentStatus) =>
    api.post<StatusChangeResult>("/admin/exam-content/status", { ids, status });

export interface ExamContentExportFilters {
    ids?: string[];
    examType?: string;
    level?: string;
    section?: string;
    part?: number;
    status?: string;
}

/** Downloads the export as a file in the browser (the request is authenticated, so a plain link cannot be used). */
export const downloadExamContentExport = async (filters: ExamContentExportFilters) => {
    const params: Record<string, string> = {};
    if (filters.ids?.length) params.ids = filters.ids.join(",");
    if (filters.examType) params.examType = filters.examType;
    if (filters.level) params.level = filters.level;
    if (filters.section) params.section = filters.section;
    if (filters.part) params.part = String(filters.part);
    if (filters.status) params.status = filters.status;

    const response = await api.get<Blob>("/admin/exam-content/export", { params, responseType: "blob" });
    const disposition = String(response.headers["content-disposition"] ?? "");
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    const filename = match ? decodeURIComponent(match[1]) : "exam-content-export.json";

    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return { exported: Number(response.headers["x-exported-count"] ?? 0), skipped: Number(response.headers["x-skipped-count"] ?? 0) };
};
