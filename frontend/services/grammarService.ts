import api from "./api";
import {
    CategoryTestStatus,
    CategoryTestSubmitRequest,
    GrammarCategoryWithLessons,
    GrammarLesson,
    LearningProgressRequest,
} from "@/types/grammar";

export const getGrammarLessons = async () => {
    return await api.get<GrammarLesson[]>("/grammar");
};

export const getGrammarLessonById = async (id: string) => {
    return await api.get<GrammarLesson>(`/grammar/${id}`);
};

export const setLearningProgress = async (request: LearningProgressRequest) => {
    return await api.post("/learning-progress", request);
};

export const getGrammarCategories = async () => {
    return await api.get<GrammarCategoryWithLessons[]>("/grammar/categories");
};

export const submitCategoryTest = async (categoryId: string, request: CategoryTestSubmitRequest) => {
    return await api.post<CategoryTestStatus>(`/grammar/categories/${categoryId}/test-result`, request);
};

export const markCategoryComplete = async (categoryId: string) => {
    return await api.post<CategoryTestStatus>(`/grammar/categories/${categoryId}/test-result/complete`);
};
