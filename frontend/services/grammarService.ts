import api from "./api";
import {
    CategoryTestStatus,
    CategoryTestSubmitRequest,
    GrammarCategoryWithLessons,
    GrammarLesson,
    GrammarLevelSummary,
    GrammarLevelView,
    LearningProgressRequest,
} from "@/types/grammar";

/** One level's categories and uncategorized lessons as light rows - never lesson content or quizzes. */
export const getGrammarLevelView = async (level: string) => {
    return await api.get<GrammarLevelView>("/grammar", { params: { level } });
};

/** Per-level published totals and the current user's learned counts, for the level selector. */
export const getGrammarLevelSummary = async () => {
    return await api.get<GrammarLevelSummary[]>("/grammar/level-summary");
};

export const getGrammarLessonById = async (id: string) => {
    return await api.get<GrammarLesson>(`/grammar/${id}`);
};

export const setLearningProgress = async (request: LearningProgressRequest) => {
    return await api.post("/learning-progress", request);
};

/** One category with its published lessons (quizzes included), for the category test. */
export const getGrammarCategoryById = async (id: string) => {
    return await api.get<GrammarCategoryWithLessons>(`/grammar/categories/${id}`);
};

export const submitCategoryTest = async (categoryId: string, request: CategoryTestSubmitRequest) => {
    return await api.post<CategoryTestStatus>(`/grammar/categories/${categoryId}/test-result`, request);
};

export const markCategoryComplete = async (categoryId: string) => {
    return await api.post<CategoryTestStatus>(`/grammar/categories/${categoryId}/test-result/complete`);
};
