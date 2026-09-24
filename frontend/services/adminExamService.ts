import api from "./api";
import { ExamExerciseManualRequest, ExamExerciseResponse, ExamFieldPreset, ExamFieldPresetRequest, ExamSection } from "@/types/exam";

export const uploadExamPassageImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return await api.post<{ url: string }>("/admin/exam/upload-image", formData, {
        headers: { "Content-Type": undefined },
    });
};

export const uploadExamPassageAudio = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return await api.post<{ url: string }>("/admin/exam/upload-audio", formData, {
        headers: { "Content-Type": undefined },
    });
};

export const getExamExercisesForAdmin = async () => {
    return await api.get<ExamExerciseResponse[]>("/admin/exam");
};

export const getExamExerciseForAdmin = async (id: string) => {
    return await api.get<ExamExerciseResponse>(`/admin/exam/${id}`);
};

export const createExamExercise = async (request: ExamExerciseManualRequest) => {
    return await api.post<ExamExerciseResponse>("/admin/exam", request);
};

export const updateExamExercise = async (id: string, request: ExamExerciseManualRequest) => {
    return await api.put<ExamExerciseResponse>(`/admin/exam/${id}`, request);
};

export const deleteExamExercise = async (id: string) => {
    return await api.delete(`/admin/exam/${id}`);
};

export const getExamFieldPresets = async (section: ExamSection, level: string) => {
    return await api.get<ExamFieldPreset[]>("/admin/exam/field-presets", { params: { section, level } });
};

export const createExamFieldPreset = async (request: ExamFieldPresetRequest) => {
    return await api.post<ExamFieldPreset>("/admin/exam/field-presets", request);
};

export const updateExamFieldPreset = async (id: string, request: ExamFieldPresetRequest) => {
    return await api.put<ExamFieldPreset>(`/admin/exam/field-presets/${id}`, request);
};

export const deleteExamFieldPreset = async (id: string) => {
    return await api.delete(`/admin/exam/field-presets/${id}`);
};
