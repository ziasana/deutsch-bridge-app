import api from "./api";
import { ExamExerciseManualRequest, ExamExerciseResponse } from "@/types/exam";

export const uploadExamPassageImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return await api.post<{ url: string }>("/admin/exam/upload-image", formData, {
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
